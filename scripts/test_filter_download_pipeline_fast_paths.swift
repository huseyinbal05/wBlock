import CryptoKit
import Foundation
@testable import wBlockCoreService

final class PipelineIncludeProtocol: URLProtocol, @unchecked Sendable {
    nonisolated(unsafe) static var requests: [URL] = []
    nonisolated(unsafe) static var responses: [String: Data] = [:]

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let url = request.url else { return }
        Self.requests.append(url)
        let body = Self.responses[url.lastPathComponent] ?? Data()
        let response = HTTPURLResponse(
            url: url,
            statusCode: 200,
            httpVersion: nil,
            headerFields: ["Content-Type": "text/plain"]
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

        // 1. Plain CRLF list without includes: processAndPublish records .normalized-sha256 without double work.
        let plainFilter = FilterList(
            name: "Plain Remote",
            url: URL(string: "https://example.com/plain.txt")!,
            category: .ads
        )
        let plainRaw = Data("! Version: 1.0\r\n||one.example^\r\n||two.example^\r\n".utf8)
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
        checkEqual(plainClassify, .unchangedContent, "unchanged CRLF plain body classifies as unchanged via digest")

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
}
