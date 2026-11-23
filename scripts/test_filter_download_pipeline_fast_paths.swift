import CryptoKit
import Foundation
@testable import wBlockCoreService

final class PipelineIncludeProtocol: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var requests: [URL] = []
    nonisolated(unsafe) static var responses: [String: Data] = [:]
    nonisolated(unsafe) static var etags: [String: String] = [:]

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let url = request.url else { return }
        Self.requests.append(url)
        let name = url.lastPathComponent
        let etag = Self.etags[name]
        let unchanged = etag.map { request.value(forHTTPHeaderField: "If-None-Match") == $0 } ?? false
        let body = unchanged ? Data() : Self.responses[name] ?? Data()
        var headers = ["Content-Type": "text/plain"]
        if !unchanged { headers["ETag"] = etag }
        let response = HTTPURLResponse(
            url: url,
            statusCode: unchanged ? 304 : 200,
            httpVersion: nil,
            headerFields: headers
        )!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: body)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}

@main
struct FilterDownloadPipelineFastPathsTests {
    private static func fail(_ message: String) -> Never {
        fputs("FAIL: \(message)\n", stderr)
        exit(1)
    }

    private static func check(_ condition: Bool, _ message: String) {
        if !condition { fail(message) }
    }

    private static func checkEqual<T: Equatable>(_ actual: T, _ expected: T, _ message: String) {
        if actual != expected {
            fail("\(message)\n  actual:   \(String(describing: actual))\n  expected: \(String(describing: expected))")
        }
    }

    static func main() async throws {
        testHostsAndHostnameRegexParity()
        try await testNormalizationFastAndRewritePaths()
        try await testPreprocessorFastPathAndEdgeCases()
        try await testDownloadProcessorRecordsDigestForUpdates()
        try await testRefreshesIncludesAfterUnchangedParent()
        try await testLegacySourceGetsIncludeMetadata()
        try await testConcurrentPublicationsKeepMatchingDigests()
        print("PASS: filter download pipeline fast paths")
    }

    private static func testHostsAndHostnameRegexParity() {
        let hostnameRegex = try! NSRegularExpression(
            pattern: "^(?:[A-Za-z0-9_](?:[A-Za-z0-9_-]*[A-Za-z0-9_])?\\.)+[A-Za-z][A-Za-z0-9-]*$"
        )
        let addressRegex = try! NSRegularExpression(
            pattern: "^(?:\\d{1,3}(?:\\.\\d{1,3}){3}|[0-9A-Fa-f]*:[0-9A-Fa-f]*:[0-9A-Fa-f:.]*(?:%\\w+)?)$"
        )
        func regexMatches(_ regex: NSRegularExpression, _ s: String) -> Bool {
            regex.firstMatch(in: s, range: NSRange(s.startIndex..., in: s)) != nil
        }

        let hostnameCases = [
            "example.com", "sub.domain.co.uk", "_ad.example.com", "a_b.c-d.com",
            "123.example", "a.b-", "a.b1", "A.B", "_._", "singlelabel",
            "-lead.com", "trail-.com", "bad..com", ".leading.com", "trailing.com.",
            "a.1b", "a.com_", "foo.bär", "ads.example/path", "ads.example$script",
            "1.2.3.4", "a.b-c", ""
        ]
        for host in hostnameCases {
            let expected = regexMatches(hostnameRegex, host)
            let actual = FilterListContentProcessing.isHostsHostname(host.utf8)
            checkEqual(actual, expected, "hostname byte matcher parity for \(host.debugDescription)")
        }

        let addressCases = [
            "0.0.0.0", "127.0.0.1", "255.255.255.255", "999.1.2.3",
            "::", "::1", "fe80::1", "fe80::1%en0", "fe80::1%eth_1", "fe80::1%wlp3s0",
            "::ffff:192.0.2.1", "2001:db8::1:2:3", "fe80::1%ü",
            "127.0.0.1:8080", "127.0.0", "1.2.3.4.5", "1234.0.0.1",
            "1.2:3:4", ":", "::1%", "::1%a-b", "::g", "0.0.0.0 ", ""
        ]
        for addr in addressCases {
            let expected = regexMatches(addressRegex, addr)
            let actual = FilterListContentProcessing.isHostsAddress(addr[...])
            checkEqual(actual, expected, "address byte matcher parity for \(addr.debugDescription)")
        }
    }

    private static func testNormalizationFastAndRewritePaths() async throws {
        // Pure LF ABP list passes through untouched (byte-for-byte identical).
        let abpList = "! Title: Clean ABP\n!#safari_cb_affinity(general)\n||ads.example^\nexample.com##.promo\n"
        checkEqual(FilterListContentProcessing.normalizedContent(from: abpList), abpList, "LF ABP list should pass through")

        // Mixed ABP list with hostname-looking substring stays unanchored.
        let mixed = "||a.example^\n_werbung.php\nexample.com##.ad\n"
        checkEqual(FilterListContentProcessing.normalizedContent(from: mixed), mixed, "mixed ABP list stays unanchored")

        // Hostname and IP edge cases (IPv4, IPv6, IPv6 %zone, underscore/hyphen rules, loopbacks).
        checkEqual(FilterListContentProcessing.hostsEntryHosts("0.0.0.0 Ads.Example localhost.localdomain # c"), ["ads.example"], "IPv4 + loopback")
        checkEqual(FilterListContentProcessing.hostsEntryHosts("::1 a.example ip6-loopback"), ["a.example"], "IPv6 ::1 + ip6-loopback")
        checkEqual(FilterListContentProcessing.hostsEntryHosts("fe80::1%en0 _sub.Example.com bad_tld.com_"), ["_sub.example.com"], "IPv6 zone + TLD underscore rejection")
        checkEqual(FilterListContentProcessing.hostsEntryHosts("::ffff:192.0.2.1 dash-tld.com-"), ["dash-tld.com-"], "IPv4-mapped IPv6 + hyphen TLD parity")
        checkEqual(FilterListContentProcessing.hostsEntryHosts("127.0.0.1:8080 a.example"), nil, "host:port is not a plain hosts address")
        checkEqual(FilterListContentProcessing.hostsEntryHosts("1.2:3:4 a.example"), nil, "dot before second colon is invalid IPv6")
        checkEqual(
            FilterListContentProcessing.normalizedContent(from: "0.0.0.0 K.example\n||kept.example^\n"),
            "||k.example^\n||kept.example^\n",
            "hosts names can lowercase to a valid ASCII domain"
        )

        // Domain-only list with CRLF, U+2028, and unsupported directives.
        var stripped: [String] = []
        let dirtyDomains = "! Title: Domains\r\n!#unsupported arg\r\nAds.Example\u{2028}||kept.example^\n"
        let normalizedDomains = FilterListContentProcessing.normalizedContent(from: dirtyDomains) {
            stripped.append($0)
        }
        checkEqual(
            normalizedDomains,
            "! Title: Domains\n||ads.example^\n||kept.example^\n",
            "dirty domain list normalizes line endings, directives, and domains"
        )
        checkEqual(stripped, ["!#unsupported arg"], "stripped directive callback invoked")

        // Hosts-file list strips loopbacks and rewrites hosts entries.
        let hostsList = "127.0.0.1 localhost\r\n0.0.0.0 Ads.Example # inline\n!#unsupported two\n"
        checkEqual(
            FilterListContentProcessing.normalizedContent(from: hostsList),
            "||ads.example^\n",
            "hosts list strips loopbacks and converts entries"
        )

        // Preserved directives stay untouched.
        let withIf = "!#if ext_ublock\n||if.example^\n!#endif\n"
        checkEqual(FilterListContentProcessing.normalizedContent(from: withIf), withIf, "preserved conditionals stay untouched")
    }

    private static func testPreprocessorFastPathAndEdgeCases() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [PipelineIncludeProtocol.self]
        let session = URLSession(configuration: config)
        defer { session.invalidateAndCancel() }
        let listURL = URL(string: "https://example.com/lists/main.txt")!
        let preprocessor = FilterPreprocessor(urlSession: session)

        // Plain LF list with !#safari_cb_affinity hits zero-split pass-through (modified == false).
        let plain = "! Title: Plain\n!#safari_cb_affinity(general)\n||ads.example^\n!#if_not_directive\n%not_include%\n"
        let plainOut = await preprocessor.preprocessWithChangeFlag(content: plain, listURL: listURL)
        check(!plainOut.modified, "plain list must take preprocessor pass-through fast path")
        checkEqual(plainOut.content, plain, "pass-through returns exact content")

        // Leading non-ASCII whitespace before !#if bypasses pass-through and evaluates condition properly.
        let nbspCond = "\u{00A0}!#if false\n||drop.example^\n!#endif\n||keep.example^"
        let nbspOut = await preprocessor.preprocessWithChangeFlag(content: nbspCond, listURL: listURL)
        check(nbspOut.modified, "leading Unicode whitespace before !#if must take full path")
        checkEqual(nbspOut.content, "||keep.example^", "leading NBSP !#if evaluates properly")
        let bareIf = await preprocessor.preprocess(content: "||keep.example^\n!#if\u{00a0}", listURL: listURL)
        checkEqual(bareIf, "||keep.example^", "trailing Unicode whitespace still permits a bare directive")

        // Bare !#if and CRLF take slow path.
        let crlf = "||a.example^\r\n||b.example^"
        let crlfOut = await preprocessor.preprocessWithChangeFlag(content: crlf, listURL: listURL)
        check(crlfOut.modified, "CRLF must normalize via slow path")
        checkEqual(crlfOut.content, "||a.example^\n\n||b.example^", "CRLF matches components(separatedBy: .newlines)")

        // Include directive expands sub-list cleanly.
        PipelineIncludeProtocol.responses["sub.txt"] = Data("||included-sub.example^\n".utf8)
        let withInclude = "||main.example^\n%include sub.txt%"
        let includeOut = await preprocessor.preprocessWithChangeFlag(content: withInclude, listURL: listURL)
        check(includeOut.modified, "include directive marks modified == true")
        checkEqual(includeOut.content, "||main.example^\n||included-sub.example^\n", "%include expands sub-list")

        // Exceeding IncludeResolver.maxExpandedLines (500,000) bypasses pass-through and enforces cap.
        let oversizedLines = Array(repeating: "||a.example^", count: IncludeResolver.maxExpandedLines + 5).joined(separator: "\n")
        let cappedOut = await preprocessor.preprocessWithChangeFlag(content: oversizedLines, listURL: listURL)
        check(cappedOut.modified, "over-line list must bypass pass-through to enforce cap")
        checkEqual(cappedOut.content.split(separator: "\n", omittingEmptySubsequences: false).count, IncludeResolver.maxExpandedLines, "maxExpandedLines cap preserved")
    }

    private static func testDownloadProcessorRecordsDigestForUpdates() async throws {
        let containerURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("wblock-pipeline-digest-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: containerURL, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: containerURL) }

        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [PipelineIncludeProtocol.self]
        let session = URLSession(configuration: config)
        defer { session.invalidateAndCancel() }

        // 1. A BOM-prefixed CRLF list compares the same way it was decoded during publication.
        let plainFilter = FilterList(
            name: "Plain Remote",
            url: URL(string: "https://example.com/plain.txt")!,
            category: .ads
        )
        let plainRaw = Data("\u{feff}! Version: 1.0\r\n||one.example^\r\n||two.example^\r\n".utf8)
        let plainResult = try await FilterDownloadProcessor.processAndPublish(
            data: plainRaw,
            sourceURL: plainFilter.url,
            filter: plainFilter,
            containerURL: containerURL,
            etag: nil,
            lastModified: nil,
            urlSession: session
        )
        checkEqual(plainResult.filter.sourceRuleCount, 2, "plain list reuses normalized rule count")
        let plainDigest = FilterListNormalizedDigest.load(for: plainFilter, containerURL: containerURL)
        check(plainDigest != nil, "processAndPublish must record FilterListNormalizedDigest for plain list")
        let plainLocal = FilterListContentProcessing.localDataForComparison(filter: plainFilter, containerURL: containerURL)
        let plainClassify = FilterUpdateResponseClassifier.classify(
            statusCode: 200,
            responseData: plainRaw,
            localData: plainLocal,
            localNormalizedDigest: plainDigest
        )
        checkEqual(plainClassify, .unchangedContent, "unchanged BOM-prefixed CRLF body matches the digest")
        checkEqual(
            FilterUpdateResponseClassifier.classify(statusCode: 200, responseData: plainRaw, localData: plainLocal),
            .unchangedContent,
            "BOM-prefixed CRLF body also matches the saved bytes without a digest"
        )

        // 2. Parent list with !#include: digest reflects unexpanded normalized parent, not expanded bytes.
        PipelineIncludeProtocol.responses["child.txt"] = Data("||child-one.example^\n||child-two.example^\n".utf8)
        let includeFilter = FilterList(
            name: "Include Remote",
            url: URL(string: "https://example.com/parent.txt")!,
            category: .ads
        )
        let parentRaw = Data("! Version: 2.0\r\n!#include child.txt\r\n||parent.example^\r\n".utf8)
        let includeResult = try await FilterDownloadProcessor.processAndPublish(
            data: parentRaw,
            sourceURL: includeFilter.url,
            filter: includeFilter,
            containerURL: containerURL,
            etag: nil,
            lastModified: nil,
            urlSession: session
        )
        checkEqual(includeResult.filter.sourceRuleCount, 3, "expanded rule count includes child rules")
        checkEqual(includeResult.filter.rawSourceRuleCount, 1, "rawSourceRuleCount counts parent rules")
        let parentDigest = FilterListNormalizedDigest.load(for: includeFilter, containerURL: containerURL)
        check(parentDigest != nil, "processAndPublish must record unexpanded normalized digest for include list")
        let parentLocal = FilterListContentProcessing.localDataForComparison(filter: includeFilter, containerURL: containerURL)
        checkEqual(
            FilterUpdateResponseClassifier.classify(
                statusCode: 200,
                responseData: parentRaw,
                localData: parentLocal,
                localNormalizedDigest: parentDigest
            ),
            .unchangedContent,
            "unchanged unexpanded parent matches stored normalized digest"
        )
        checkEqual(
            FilterUpdateResponseClassifier.classify(
                statusCode: 200,
                responseData: Data("! Version: 2.1\r\n!#include child.txt\r\n||parent.example^\r\n||added.example^\r\n".utf8),
                localData: parentLocal,
                localNormalizedDigest: parentDigest
            ),
            .updatedContent,
            "changed parent invalidates normalized digest match"
        )

        // 3. Removing filter cache files removes the .normalized-sha256 sidecar too.
        _ = try ContentBlockerIncrementalCache.removeFilterCacheFiles(for: plainFilter, containerURL: containerURL)
        check(
            FilterListNormalizedDigest.load(for: plainFilter, containerURL: containerURL) == nil,
            "removeFilterCacheFiles must invalidate loaded normalized digest"
        )
        let plainDigestURL = containerURL.appendingPathComponent(
            "\(ContentBlockerIncrementalCache.localFilename(for: plainFilter)).normalized-sha256"
        )
        check(
            !FileManager.default.fileExists(atPath: plainDigestURL.path),
            "removeFilterCacheFiles must remove .normalized-sha256 sidecar file"
        )
    }

    private static func testRefreshesIncludesAfterUnchangedParent() async throws {
        let container = try temporaryContainer()
        defer { try? FileManager.default.removeItem(at: container) }
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [PipelineIncludeProtocol.self]
        let session = URLSession(configuration: config)
        defer { session.invalidateAndCancel() }

        let filter = FilterList(name: "Linked", url: URL(string: "https://example.com/linked.txt")!, category: .ads)
        let parent = Data("||parent.example^\n%include linked-child.txt%".utf8)
        let etag = "\"unmodified-parent\""
        PipelineIncludeProtocol.etags["linked.txt"] = etag
        PipelineIncludeProtocol.responses["linked.txt"] = parent
        PipelineIncludeProtocol.responses["linked-child.txt"] = Data("||original.example^".utf8)
        _ = try await FilterDownloadProcessor.processAndPublish(
            data: parent, sourceURL: filter.url, filter: filter, containerURL: container,
            etag: etag, lastModified: nil, urlSession: session
        )

        func refresh(etag: String?) async throws -> FilterDownloadProcessor.PreparedSource? {
            let result = try await FilterListFetchChain.fetchUpdate(
                for: filter, containerURL: container, session: session, etag: etag, lastModified: nil,
                timeout: 1, patches: FilterPatchCache()
            )
            checkEqual(result.data, parent, "conditional checks should still have the original parent text")
            checkEqual(result.response.value(forHTTPHeaderField: "ETag"), "\"unmodified-parent\"", "reused parent retains its validator")
            check(result.requiresExpandedComparison, "an unchanged parent must still recheck its includes")
            return try await FilterDownloadProcessor.prepareChangedSource(
                data: result.data, sourceURL: result.sourceURL, usedFallbackMirror: result.servedFallback,
                filter: filter, containerURL: container, urlSession: session
            )
        }

        for (name, validator) in [("new-child-after-304", etag), ("new-child-after-200", nil)] {
            PipelineIncludeProtocol.requests = []
            PipelineIncludeProtocol.responses["linked-child.txt"] = Data("||\(name).example^".utf8)
            guard let prepared = try await refresh(etag: validator) else { fail("a child-only change must be found") }
            _ = try FilterDownloadProcessor.publish(prepared, containerURL: container, etag: etag, lastModified: nil)
            let saved = FilterListContentProcessing.localDataForComparison(filter: filter, containerURL: container)
            checkEqual(saved, Data("||parent.example^\n||\(name).example^".utf8), "publishing uses the new child rules")
            checkEqual(PipelineIncludeProtocol.requests.map(\.lastPathComponent), ["linked.txt", "linked-child.txt"],
                       "publishing the prepared result must not fetch the same child twice")
        }

        let storeURL = container.appendingPathComponent(PendingFilterUpdateRevisions.filename)
        let priorRevision = PendingFilterUpdateRevisions.load(storeURL: storeURL)
        let unchanged = try await refresh(etag: etag)
        check(unchanged == nil, "unchanged expanded rules need no publication")
        checkEqual(PendingFilterUpdateRevisions.load(storeURL: storeURL), priorRevision, "unchanged includes leave the revision alone")
    }

    private static func testLegacySourceGetsIncludeMetadata() async throws {
        let container = try temporaryContainer()
        defer { try? FileManager.default.removeItem(at: container) }
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [PipelineIncludeProtocol.self]
        let session = URLSession(configuration: config)
        defer { session.invalidateAndCancel() }

        let filter = FilterList(name: "Legacy", url: URL(string: "https://example.com/legacy.txt")!, category: .ads)
        let filename = ContentBlockerIncrementalCache.localFilename(for: filter)
        let source = container.appendingPathComponent(filename)
        try Data("||parent.example^\n||legacy-child.example^".utf8).write(to: source)
        let parent = Data("||parent.example^\n!#include legacy-child.txt".utf8)
        let etag = "\"legacy\""
        PipelineIncludeProtocol.etags["legacy.txt"] = etag
        PipelineIncludeProtocol.responses["legacy.txt"] = parent
        PipelineIncludeProtocol.responses["legacy-child.txt"] = Data("||legacy-child.example^".utf8)

        let initial = try await FilterListFetchChain.fetchUpdate(
            for: filter, containerURL: container, session: session, etag: etag, lastModified: nil,
            timeout: 1, patches: FilterPatchCache()
        )
        checkEqual(initial.data, parent, "legacy sources need one full fetch to discover includes")
        let prepared = try await FilterDownloadProcessor.prepareChangedSource(
            data: initial.data, sourceURL: initial.sourceURL, usedFallbackMirror: initial.servedFallback,
            filter: filter, containerURL: container, urlSession: session
        )
        guard let prepared else { fail("a legacy include parent needs its baseline installed") }
        _ = try FilterDownloadProcessor.publish(prepared, containerURL: container, etag: etag, lastModified: nil)
        checkEqual(FilterListNormalizedDigest.state(for: filter, containerURL: container)?.includeSource, filter.url,
                   "legacy source now has a recorded include parent")

        let plain = FilterList(name: "Legacy Flat", url: URL(string: "https://example.com/legacy-flat.txt")!, category: .ads)
        let plainSource = container.appendingPathComponent(ContentBlockerIncrementalCache.localFilename(for: plain))
        let plainBody = Data("||legacy-flat.example^".utf8)
        try plainBody.write(to: plainSource)
        PipelineIncludeProtocol.etags["legacy-flat.txt"] = etag
        PipelineIncludeProtocol.responses["legacy-flat.txt"] = plainBody
        let unchanged = try await FilterDownloadProcessor.prepareChangedSource(
            data: plainBody, sourceURL: plain.url, usedFallbackMirror: false,
            filter: plain, containerURL: container, urlSession: session
        )
        check(unchanged == nil, "an unchanged legacy flat list can be cataloged without republishing it")
        PipelineIncludeProtocol.requests = []
        let checked = try await FilterListFetchChain.fetchUpdate(
            for: plain, containerURL: container, session: session, etag: etag, lastModified: nil,
            timeout: 1, patches: FilterPatchCache()
        )
        checkEqual(checked.response.statusCode, 304, "later checks retain the ordinary conditional GET path")
        check(!checked.requiresExpandedComparison, "a flat list does not need expanded comparison")
        checkEqual(PipelineIncludeProtocol.requests, [plain.url], "an unchanged flat list makes only its regular request")
    }

    private static func testConcurrentPublicationsKeepMatchingDigests() async throws {
        let container = try temporaryContainer()
        defer { try? FileManager.default.removeItem(at: container) }
        let filter = FilterList(name: "Concurrent", url: URL(string: "https://example.com/concurrent.txt")!, category: .ads)

        try await withThrowingTaskGroup(of: Void.self) { group in
            for index in 0..<12 {
                group.addTask {
                    _ = try await FilterDownloadProcessor.processAndPublish(
                        data: Data("||source-\(index).example^".utf8), sourceURL: filter.url, filter: filter,
                        containerURL: container, etag: "\(index)", lastModified: nil, urlSession: .shared
                    )
                }
            }
            try await group.waitForAll()
        }

        let filename = ContentBlockerIncrementalCache.localFilename(for: filter)
        let source = container.appendingPathComponent(filename)
        let saved = try Data(contentsOf: source)
        checkEqual(FilterListNormalizedDigest.load(for: filter, containerURL: container), DigestSupport.sha256Hex(saved),
                   "the digest must match the winning publication")

        let date = try FileManager.default.attributesOfItem(atPath: source.path)[.modificationDate]!
        try Data(repeating: 65, count: saved.count).write(to: source, options: .atomic)
        try FileManager.default.setAttributes([.modificationDate: date], ofItemAtPath: source.path)
        checkEqual(FilterListNormalizedDigest.load(for: filter, containerURL: container), nil,
                   "size and timestamp alone must not validate a digest after replacement")
    }

    private static func temporaryContainer() throws -> URL {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory
    }
}
