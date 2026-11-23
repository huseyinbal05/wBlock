import Foundation

public struct FilterListFetchResult: Sendable {
    public let data: Data
    public let response: HTTPURLResponse
    public let sourceURL: URL
    public let servedFallback: Bool
    public let requiresExpandedComparison: Bool

    /// The same fact as `servedFallback`, under the name the response classifier takes.
    public var usedFallbackMirror: Bool { servedFallback }

    public init(
        data: Data, response: HTTPURLResponse, sourceURL: URL, servedFallback: Bool,
        requiresExpandedComparison: Bool = false
    ) {
        self.data = data; self.response = response; self.sourceURL = sourceURL; self.servedFallback = servedFallback
        self.requiresExpandedComparison = requiresExpandedComparison
    }
}

/// One update run's uBO patch downloads. Every list in a uAssets release names
/// the same patch file, so each file is fetched once per run, not once per list.
public actor FilterPatchCache {
    private struct PatchDownload {
        let task: Task<(Data, URLResponse), Error>
        /// Callers that joined the download and have not cancelled. The shared
        /// task is cancelled only when the last of them cancels.
        var waiters: Int
    }

    private var downloads: [URL: PatchDownload] = [:]

    public init() {}

    func download(_ url: URL, session: URLSession, timeout: TimeInterval) async throws -> (Data, URLResponse) {
        let task: Task<(Data, URLResponse), Error>
        if let existing = downloads[url] {
            downloads[url]?.waiters += 1
            task = existing.task
        } else {
            task = Task {
                try await session.data(for: URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: timeout))
            }
            downloads[url] = PatchDownload(task: task, waiters: 1)
        }
        return try await withTaskCancellationHandler {
            try await task.value
        } onCancel: {
            Task { await self.release(url) }
        }
    }

    private func release(_ url: URL) {
        guard var entry = downloads[url] else { return }
        entry.waiters -= 1
        guard entry.waiters == 0 else {
            downloads[url] = entry
            return
        }
        entry.task.cancel()
        downloads[url] = nil
    }
}

public enum FilterListFetchChain {
    /// Raw copy of a list's last full download that advertised `! Diff-Path:`,
    /// which that list's next patch applies to.
    public static func diffBaselineURL(for filter: FilterList, containerURL: URL) -> URL {
        containerURL.appendingPathComponent("diff-baseline-\(ContentBlockerIncrementalCache.localFilename(for: filter))")
    }

    /// A parent may be unchanged even though its included files have changed.
    /// Reuse its exact raw body on a 304, including a 304 synthesized by the delta path.
    public static func fetchUpdate(
        for filter: FilterList, containerURL: URL?, session: URLSession,
        etag: String?, lastModified: String?, timeout: TimeInterval, patches: FilterPatchCache,
        hedgedFallback: Bool = false, log: (@Sendable (String) async -> Void)? = nil
    ) async throws -> FilterListFetchResult {
        let cached = containerURL.flatMap { FilterListNormalizedDigest.state(for: filter, containerURL: $0) }
        // Older downloads have no include metadata. Inspect their next full response once.
        let needsInspection = !filter.isOptimizedBuiltin && cached == nil && containerURL.map {
            ContentBlockerIncrementalCache.existingLocalFileURL(for: filter, containerURL: $0) != nil
        } == true
        func fetchParent(unconditional: Bool) async throws -> FilterListFetchResult {
            try await fetch(
                session: session, primaryURL: filter.url,
                fallbackURLs: FilterListURLMirror.fallbackURLs(for: filter.url),
                etag: unconditional ? nil : etag, lastModified: unconditional ? nil : lastModified,
                timeout: timeout, diffBaselineURL: unconditional ? nil : containerURL.map {
                    diffBaselineURL(for: filter, containerURL: $0)
                }, patches: patches, hedgedFallback: hedgedFallback, log: log
            )
        }

        let result = try await fetchParent(unconditional: needsInspection)
        guard let containerURL, let cached, let includeSource = cached.includeSource else {
            guard needsInspection else { return result }
            return FilterListFetchResult(
                data: result.data, response: result.response, sourceURL: result.sourceURL,
                servedFallback: result.servedFallback, requiresExpandedComparison: true
            )
        }

        let parent: FilterListFetchResult
        if result.response.statusCode == 304 {
            if includeSource == result.sourceURL,
               let body = FilterListNormalizedDigest.cachedParent(for: filter, containerURL: containerURL, state: cached) {
                var headers: [String: String] = [:]
                headers["ETag"] = result.response.value(forHTTPHeaderField: "ETag") ?? etag
                headers["Last-Modified"] = result.response.value(forHTTPHeaderField: "Last-Modified") ?? lastModified
                let response = HTTPURLResponse(
                    url: result.sourceURL, statusCode: 200, httpVersion: nil, headerFields: headers
                )!
                parent = FilterListFetchResult(data: body, response: response, sourceURL: result.sourceURL, servedFallback: false)
            } else {
                parent = try await fetchParent(unconditional: true)
            }
        } else {
            parent = result
        }
        return FilterListFetchResult(
            data: parent.data, response: parent.response, sourceURL: parent.sourceURL,
            servedFallback: parent.servedFallback, requiresExpandedComparison: true
        )
    }

    /// Reads `! Expires: <n> days|hours|minutes` (or `6h`, `4d`, `1 day`) from the
    /// header of a list. The result is clamped to 1 hour through 14 days, and nil
    /// when the header has no usable value.
    public static func parseExpiresInterval(from headerPrefix: String) -> TimeInterval? {
        for line in headerPrefix.split(whereSeparator: \.isNewline) {
            let text = line.drop(while: { $0 == "!" || $0 == " " || $0 == "\t" })
            guard text.lowercased().hasPrefix("expires:") else { continue }
            let seconds = FilterDiffExpiresParser.parseSeconds(String(text.dropFirst("expires:".count)))
            return seconds > 0 ? min(max(seconds, 3_600), 14 * 86_400) : nil
        }
        return nil
    }

    /// With `diffBaselineURL` and `patches`, a list that advertised
    /// `! Diff-Path:` is first brought up to date from its uBO patch. A patch
    /// that is not published yet means the list has not changed, reported as a
    /// 304. A patched list is reported as a 200 without validators, since the
    /// server's validators for the new body are unknown. Any patch failure
    /// falls through to the conditional GET.
    ///
    /// With `hedgedFallback`, the first fallback starts `hedgeDelay` seconds
    /// after the primary begins, if the primary has not answered by then. The
    /// first valid response wins and the other request is cancelled.
    public static func fetch(
        session: URLSession,
        primaryURL: URL,
        fallbackURLs: [URL],
        etag: String? = nil,
        lastModified: String? = nil,
        timeout: TimeInterval = 15,
        retryDelay: TimeInterval = 2,
        diffBaselineURL: URL? = nil,
        patches: FilterPatchCache? = nil,
        hedgedFallback: Bool = false,
        hedgeDelay: TimeInterval = 3,
        log: (@Sendable (String) async -> Void)? = nil
    ) async throws -> FilterListFetchResult {
        if let diffBaselineURL, let patches,
           let delta = await patchedContent(
               listURL: primaryURL, baselineURL: diffBaselineURL, session: session,
               patches: patches, timeout: timeout, log: log ?? { _ in }) {
            // A cancelled waiter that was not the last one returns here, once the shared patch lands.
            try Task.checkCancellation()
            let response = HTTPURLResponse(
                url: primaryURL, statusCode: delta == nil ? 304 : 200, httpVersion: nil, headerFields: nil)!
            return FilterListFetchResult(data: delta ?? Data(), response: response, sourceURL: primaryURL, servedFallback: false)
        }
        try Task.checkCancellation()

        let fallbacks = fallbackURLs.filter { $0 != primaryURL }
        if hedgedFallback, let hedge = fallbacks.first {
            do {
                return try await hedgedFetch(
                    session: session, primaryURL: primaryURL, hedge: hedge, etag: etag,
                    lastModified: lastModified, timeout: timeout, retryDelay: retryDelay, hedgeDelay: hedgeDelay)
            } catch {
                if Task.isCancelled { throw error }
                return try await walkFallbacks(Array(fallbacks.dropFirst()), session: session, timeout: timeout, lastError: error)
            }
        }
        do {
            return try await fetchPrimary(
                session: session, url: primaryURL, etag: etag, lastModified: lastModified,
                timeout: timeout, retryDelay: retryDelay)
        } catch {
            if Task.isCancelled || error is FilterListTooLargeError { throw error }
            return try await walkFallbacks(fallbacks, session: session, timeout: timeout, lastError: error)
        }
    }

    /// The primary URL with a conditional GET. One retry after a retryable
    /// failure. Other statuses end the attempt at once.
    private static func fetchPrimary(
        session: URLSession,
        url: URL,
        etag: String?,
        lastModified: String?,
        timeout: TimeInterval,
        retryDelay: TimeInterval
    ) async throws -> FilterListFetchResult {
        var lastError: Error = URLError(.badServerResponse)
        for attempt in 0..<2 {
            try Task.checkCancellation()
            var request = NetworkRequestFactory.makeConditionalRequest(
                url: url, etag: etag, lastModified: lastModified, timeout: timeout)
            request.cachePolicy = .reloadIgnoringLocalCacheData
            let (data, response): (Data, HTTPURLResponse)
            do {
                (data, response) = try await load(request, session: session)
            } catch let tooLarge as FilterListTooLargeError {
                throw tooLarge
            } catch {
                if Task.isCancelled { throw error }
                lastError = error
                if attempt == 0 && retryDelay > 0 {
                    try await Task.sleep(nanoseconds: UInt64(retryDelay * 1_000_000_000))
                }
                continue
            }
            if response.statusCode == 304 {
                return FilterListFetchResult(data: data, response: response, sourceURL: url, servedFallback: false)
            }
            if isValidList(data, response) {
                return FilterListFetchResult(data: data, response: response, sourceURL: url, servedFallback: false)
            }
            guard FilterUpdateResponseClassifier.isRetryable(statusCode: response.statusCode) || response.statusCode == 200 else {
                lastError = URLError(.badServerResponse)
                break
            }
            lastError = URLError(.badServerResponse)
            if attempt == 0 && retryDelay > 0 {
                try await Task.sleep(nanoseconds: UInt64(retryDelay * 1_000_000_000))
            }
        }
        throw lastError
    }

    /// One unconditional GET. A 304 is not usable here, so only a valid 200 counts.
    private static func fetchFallback(_ url: URL, session: URLSession, timeout: TimeInterval) async throws -> FilterListFetchResult {
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: timeout)
        request.httpShouldHandleCookies = false
        let (data, response) = try await load(request, session: session)
        guard isValidList(data, response) else { throw URLError(.badServerResponse) }
        return FilterListFetchResult(data: data, response: response, sourceURL: url, servedFallback: true)
    }

    /// Tries each fallback in order and returns the first valid one. Once the
    /// task is cancelled, the walk stops instead of trying the next mirror.
    private static func walkFallbacks(
        _ urls: [URL],
        session: URLSession,
        timeout: TimeInterval,
        lastError: Error
    ) async throws -> FilterListFetchResult {
        var lastError = lastError
        for url in urls {
            try Task.checkCancellation()
            do {
                return try await fetchFallback(url, session: session, timeout: timeout)
            } catch {
                if Task.isCancelled { throw error }
                lastError = error
            }
        }
        throw lastError
    }

    /// Runs the primary chain and the first fallback concurrently. The fallback
    /// starts after `hedgeDelay` seconds. The first valid response wins and
    /// cancels the other request. Throws only when both fail.
    private static func hedgedFetch(
        session: URLSession,
        primaryURL: URL,
        hedge: URL,
        etag: String?,
        lastModified: String?,
        timeout: TimeInterval,
        retryDelay: TimeInterval,
        hedgeDelay: TimeInterval
    ) async throws -> FilterListFetchResult {
        let outcome = await withTaskGroup(of: Result<FilterListFetchResult, Error>.self) { group in
            group.addTask {
                await attempt {
                    try await fetchPrimary(
                        session: session, url: primaryURL, etag: etag, lastModified: lastModified,
                        timeout: timeout, retryDelay: retryDelay)
                }
            }
            group.addTask {
                await attempt {
                    try await Task.sleep(nanoseconds: UInt64(max(0, hedgeDelay) * 1_000_000_000))
                    return try await fetchFallback(hedge, session: session, timeout: timeout)
                }
            }
            var lastError: Error = URLError(.badServerResponse)
            for await child in group {
                switch child {
                case .success:
                    group.cancelAll()
                    return child
                case .failure(let error):
                    lastError = error
                }
            }
            return .failure(lastError)
        }
        return try outcome.get()
    }

    /// A 200 whose body reads as a filter list. The only response a list fetch accepts as content.
    private static func isValidList(_ data: Data, _ response: HTTPURLResponse) -> Bool {
        guard response.statusCode == 200, let content = String(data: data, encoding: .utf8) else { return false }
        return FilterListContentValidator.appearsToBeFilterList(content)
    }

    /// Downloads to a temporary file and maps it, so the body is not copied onto
    /// the heap as it arrives. A body over the size cap is refused.
    private static func load(_ request: URLRequest, session: URLSession) async throws -> (Data, HTTPURLResponse) {
        let (fileURL, response) = try await session.download(for: request)
        defer { try? FileManager.default.removeItem(at: fileURL) }
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        let limit = Int64(FilterListTooLargeError.maxBytes)
        let size = Int64(try fileURL.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0)
        guard http.expectedContentLength <= limit, size <= limit else {
            throw FilterListTooLargeError(ruleCount: nil)
        }
        return (try Data(contentsOf: fileURL, options: .mappedIfSafe), http)
    }

    /// Captures a child's outcome as a value, so one failed attempt does not end a race.
    private static func attempt<T>(_ body: () async throws -> T) async -> Result<T, Error> {
        do {
            return .success(try await body())
        } catch {
            return .failure(error)
        }
    }

    /// uBO-style delta update. `nil` means fall back to a full fetch,
    /// `.some(nil)` means no patch is due yet, and `.some(data)` is the patched list.
    ///
    /// Only the first 4 KB of the baseline is read until a patch block is in hand,
    /// since the header decides whether a patch is due at all.
    private static func patchedContent(
        listURL: URL,
        baselineURL: URL,
        session: URLSession,
        patches: FilterPatchCache,
        timeout: TimeInterval,
        log: @Sendable (String) async -> Void
    ) async -> Data?? {
        guard let header = baselineHeader(at: baselineURL),
              let metadata = FilterDiffUpdater.parseMetadata(from: header)
        else { return nil }
        let now = Date()
        let availability = FilterDiffUpdater.patchAvailabilityTime(metadata: metadata, now: now)

        // uBO's "nopatch-yet" gate: the list and its patch ship together.
        if let availability, now < availability {
            await log("deferring patch fetch (expected at \(availability))")
            return .some(nil)
        }
        guard let patchURL = FilterDiffUpdater.resolvePatchURL(metadata: metadata, listURL: listURL) else { return nil }

        let patchText: String
        do {
            let (data, response) = try await patches.download(patchURL, session: session, timeout: timeout)
            guard let http = response as? HTTPURLResponse else { return nil }
            guard (200..<300).contains(http.statusCode) else {
                // Within the validity window a missing patch is "nopatch-yet";
                // beyond it, fall back to a full fetch.
                if let availability, metadata.diffExpiresSeconds > 0,
                   now.timeIntervalSince(availability) < 4 * metadata.diffExpiresSeconds {
                    await log("no patch yet (status \(http.statusCode)); deferring")
                    return .some(nil)
                }
                await log("patch fetch returned status \(http.statusCode); falling back to full fetch")
                return nil
            }
            guard let text = String(data: data, encoding: .utf8) else { return nil }
            patchText = text
        } catch {
            await log("patch fetch failed (\(error.localizedDescription)); falling back to full fetch")
            return nil
        }

        guard let block = FilterDiffUpdater.parsePatchFile(patchText)?[metadata.diffName] else {
            await log("patch at \(patchURL.absoluteString) has no usable block '\(metadata.diffName)'; falling back to full fetch")
            return nil
        }
        guard let baselineText = try? String(contentsOf: baselineURL, encoding: .utf8) else { return nil }
        switch FilterDiffUpdater.applyBlock(block, to: baselineText) {
        case .success(let patchedText):
            await log("applied \(patchText.utf8.count) byte patch from \(patchURL.absoluteString)")
            return .some(Data(patchedText.utf8))
        case .badPatch:
            await log("patch failed to apply (malformed); falling back to full fetch")
            return nil
        case .checksumMismatch(let expected, let computed):
            await log("checksum mismatch (expected \(expected), computed \(computed)); falling back to full fetch")
            return nil
        }
    }

    /// The first 4 KB of a baseline file. The `! Diff-*` fields sit within its first 1 KB.
    private static func baselineHeader(at url: URL) -> String? {
        guard let handle = try? FileHandle(forReadingFrom: url) else { return nil }
        defer { try? handle.close() }
        guard let data = try? handle.read(upToCount: 4096) else { return nil }
        return String(decoding: data, as: UTF8.self)
    }
}

/// The normalized parent digest and, for expanded lists, the identity of its raw baseline.
public enum FilterListNormalizedDigest {
    struct State: Codable, Equatable {
        let digest: String
        let sourceIdentity: String
        let includeSource: URL?
        let baselineIdentity: String?
    }
    private static func sidecarURL(for filter: FilterList, containerURL: URL) -> URL {
        containerURL.appendingPathComponent("\(ContentBlockerIncrementalCache.localFilename(for: filter)).normalized-sha256")
    }

    private static func savedFileURL(for filter: FilterList, containerURL: URL) -> URL {
        containerURL.appendingPathComponent(ContentBlockerIncrementalCache.localFilename(for: filter))
    }

    private static func identity(of url: URL) -> String? {
        guard let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
              let inode = attributes[.systemFileNumber],
              let size = attributes[.size], let modified = attributes[.modificationDate] as? Date
        else { return nil }
        return "\(inode)|\(size)|\(modified.timeIntervalSince1970)"
    }

    /// Call under the publication lock so the identities describe this download.
    static func record(normalizedDigest: String, for filter: FilterList, containerURL: URL, includeSource: URL?) {
        let fileURL = savedFileURL(for: filter, containerURL: containerURL)
        guard let saved = identity(of: fileURL) else { return }
        let baseline = includeSource.flatMap { _ in
            identity(of: FilterListFetchChain.diffBaselineURL(for: filter, containerURL: containerURL))
        }
        let state = State(
            digest: normalizedDigest, sourceIdentity: saved, includeSource: includeSource, baselineIdentity: baseline
        )
        if let data = try? JSONEncoder().encode(state) {
            try? FilterArtifactStorage.write(data, to: sidecarURL(for: filter, containerURL: containerURL))
        }
    }

    /// The recorded digest, or nil when the saved file has changed since it was recorded.
    public static func load(for filter: FilterList, containerURL: URL) -> String? {
        state(for: filter, containerURL: containerURL)?.digest
    }

    static func state(for filter: FilterList, containerURL: URL) -> State? {
        guard let data = try? Data(contentsOf: sidecarURL(for: filter, containerURL: containerURL)),
              let state = try? JSONDecoder().decode(State.self, from: data),
              state.sourceIdentity == identity(of: savedFileURL(for: filter, containerURL: containerURL))
        else { return nil }
        return state
    }

    static func cachedParent(for filter: FilterList, containerURL: URL, state: State) -> Data? {
        let url = FilterListFetchChain.diffBaselineURL(for: filter, containerURL: containerURL)
        guard let baselineIdentity = state.baselineIdentity, baselineIdentity == identity(of: url),
              let data = try? Data(contentsOf: url), baselineIdentity == identity(of: url),
              state.sourceIdentity == identity(of: savedFileURL(for: filter, containerURL: containerURL))
        else { return nil }
        return data
    }
}
