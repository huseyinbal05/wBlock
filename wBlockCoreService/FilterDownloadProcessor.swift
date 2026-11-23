import Foundation

/// A list too big to convert. The engine needs about 1.4 GB per million
/// rules, so a 40-million-rule list got the app killed, and Safari holds
/// 150,000 rules per blocker anyway. Refused before decoding when the body
/// alone is too big, so the download can't exhaust memory either.
public struct FilterListTooLargeError: Error, Equatable {
    public static let maxBytes = 64 << 20
    public static let maxRules = 1_000_000
    /// Rules all selected lists may add up to before Apply refuses, well
    /// past real setups and short of what the device's memory can't hold.
    #if os(iOS)
    public static let maxApplyRules = 2_000_000
    #else
    public static let maxApplyRules = 4_000_000
    #endif
    /// Nil when the body was refused by size before its rules were counted.
    public let ruleCount: Int?
}

public enum FilterDownloadProcessor {
    private actor IncludeFailureTracker {
        private(set) var failed = false

        func markFailed() {
            failed = true
        }
    }

    private enum ProcessingError: Error {
        case invalidContent
        case decodingFailed
        case publicationFailed
    }

    /// A list after normalization and include expansion, ready to stage.
    public struct PreparedSource: Sendable {
        fileprivate var data: Data
        fileprivate var filter: FilterList
        fileprivate let strippedDirectives: [String]
        /// The raw body for delta updates or rechecking included files.
        fileprivate let baselineData: Data?
        /// Digest of the normalized unexpanded body when preprocessing modified the text;
        /// nil when the saved `data` is already identical (`sourceSHA256` applies directly).
        fileprivate let normalizedDigest: String?
        fileprivate let includeSource: URL?
    }

    public static func processAndPublish(
        data: Data,
        sourceURL: URL,
        filter: FilterList,
        containerURL: URL,
        etag: String?,
        lastModified: String?,
        urlSession: URLSession,
        onIncludeFetchError: IncludeResolver.FetchErrorHandler? = nil
    ) async throws -> (filter: FilterList, strippedDirectives: [String]) {
        let expanded = try await expandSource(
            data: data, sourceURL: sourceURL, filter: filter,
            urlSession: urlSession, onIncludeFetchError: onIncludeFetchError)
        return try publish(expanded, containerURL: containerURL, etag: etag, lastModified: lastModified)
    }

    /// Compare the expanded rules when a known or previously untracked source is checked.
    /// The caller can reuse the prepared result to publish without another include fetch.
    public static func prepareChangedSource(
        data: Data, sourceURL: URL, usedFallbackMirror: Bool, filter: FilterList, containerURL: URL,
        urlSession: URLSession, onIncludeFetchError: IncludeResolver.FetchErrorHandler? = nil
    ) async throws -> PreparedSource? {
        if usedFallbackMirror, let text = String(data: data, encoding: .utf8),
           let local = FilterListContentProcessing.localDataForComparison(filter: filter, containerURL: containerURL),
           FilterUpdateResponseClassifier.isOlderMirror(text, than: local) {
            return nil
        }
        let expanded = try await expandSource(
            data: data, sourceURL: sourceURL, filter: filter,
            urlSession: urlSession, onIncludeFetchError: onIncludeFetchError
        )
        guard expanded.data == FilterListContentProcessing.localDataForComparison(filter: filter, containerURL: containerURL)
        else { return expanded }

        let digest = expanded.normalizedDigest ?? DigestSupport.sha256Hex(expanded.data)
        if let current = FilterListNormalizedDigest.state(for: filter, containerURL: containerURL) {
            guard current.digest == digest, current.includeSource == expanded.includeSource else { return expanded }
            if let baseline = expanded.baselineData, expanded.includeSource != nil,
               FilterListNormalizedDigest.cachedParent(for: filter, containerURL: containerURL, state: current) != baseline {
                return expanded
            }
            return nil
        }

        // Catalog unchanged legacy lists without replacing their source or creating a revision.
        // Include parents need a normal publish to install their raw baseline under the same lock.
        guard expanded.includeSource == nil else { return expanded }
        let storeURL = containerURL.appendingPathComponent(PendingFilterUpdateRevisions.filename)
        return try PendingFilterUpdateRevisions.withPublicationLock(for: storeURL) {
            guard FilterListContentProcessing.localDataForComparison(filter: filter, containerURL: containerURL) == expanded.data,
                  FilterListNormalizedDigest.state(for: filter, containerURL: containerURL) == nil else { return expanded }
            FilterListNormalizedDigest.record(normalizedDigest: digest, for: filter, containerURL: containerURL, includeSource: nil)
            return nil
        }
    }

    public static func publish(
        _ prepared: PreparedSource, containerURL: URL, etag: String?, lastModified: String?
    ) throws -> (filter: FilterList, strippedDirectives: [String]) {
        try Task.checkCancellation()
        var expanded = prepared
        expanded.filter.etag = etag
        expanded.filter.serverLastModified = lastModified

        let filter = expanded.filter
        let uuid = filter.id.uuidString
        let filename = ContentBlockerIncrementalCache.localFilename(for: filter)
        let fileURL = containerURL.appendingPathComponent(filename)
        let baselineURL = FilterListFetchChain.diffBaselineURL(for: filter, containerURL: containerURL)
        let stagedFileURL = containerURL.appendingPathComponent(
            ".pending-filter-\(uuid)-\(UUID().uuidString).txt",
            isDirectory: false
        )
        // Runs on every exit that does not publish. After a successful publish the
        // staged file has been moved into place, so this is a no-op.
        defer { try? FileManager.default.removeItem(at: stagedFileURL) }
        if filter.isCustom {
            try expanded.data.write(to: stagedFileURL, options: .atomic)
        } else {
            try FilterArtifactStorage.write(expanded.data, to: stagedFileURL)
        }
        let sourceSHA256 = FilterUpdateResponseClassifier.sha256Hex(expanded.data)
        // The staged copy is on disk, so drop the in-memory body before publishing.
        expanded.data = Data()

        let updatedFilter = expanded.filter
        let baselineData = expanded.baselineData
        let strippedDirectives = expanded.strippedDirectives
        let normalizedDigest = expanded.normalizedDigest ?? sourceSHA256
        let includeSource = expanded.includeSource
        let revisionStoreURL = containerURL.appendingPathComponent(
            PendingFilterUpdateRevisions.filename,
            isDirectory: false
        )
        guard PendingFilterUpdateRevisions.markDownloaded(
            filterID: uuid,
            etag: etag,
            lastModified: lastModified,
            version: updatedFilter.version.isEmpty ? nil : updatedFilter.version,
            sourceSHA256: sourceSHA256,
            sourceFilename: filename,
            stagedFilename: stagedFileURL.lastPathComponent,
            storeURL: revisionStoreURL,
            publish: {
                // Clear stale delta state before exposing a new source. If writing
                // the new baseline later fails, future updates safely use a full fetch.
                if FileManager.default.fileExists(atPath: baselineURL.path) {
                    do {
                        try FileManager.default.removeItem(at: baselineURL)
                    } catch {
                        try FilterArtifactStorage.write(Data(), to: baselineURL)
                    }
                }
                if FileManager.default.fileExists(atPath: fileURL.path) {
                    // mmap'd by wbe; replace only by atomic rename
                    _ = try FileManager.default.replaceItemAt(fileURL, withItemAt: stagedFileURL)
                } else {
                    try FileManager.default.moveItem(at: stagedFileURL, to: fileURL)
                }
                if !filter.isCustom { FilterArtifactStorage.excludeFromBackup(fileURL) }
                if let baselineData {
                    do {
                        try FilterArtifactStorage.write(baselineData, to: baselineURL, sharingBlocksWith: fileURL)
                    } catch {
                        try? FileManager.default.removeItem(at: baselineURL)
                    }
                }
                FilterListNormalizedDigest.record(
                    normalizedDigest: normalizedDigest, for: filter, containerURL: containerURL,
                    includeSource: includeSource
                )
            }
        ) != nil else {
            throw ProcessingError.publicationFailed
        }
        return (filter: updatedFilter, strippedDirectives: strippedDirectives)
    }

    /// Decodes, normalizes, and expands includes. The raw and normalized copies
    /// are released as soon as the expanded body exists.
    private static func expandSource(
        data: Data,
        sourceURL: URL,
        filter: FilterList,
        urlSession: URLSession,
        onIncludeFetchError: IncludeResolver.FetchErrorHandler?
    ) async throws -> PreparedSource {
        guard data.count <= FilterListTooLargeError.maxBytes else {
            throw FilterListTooLargeError(ruleCount: nil)
        }
        guard FilterUpdateResponseClassifier.looksLikeFilterListData(data) else {
            throw ProcessingError.decodingFailed
        }
        let normalized = try normalize(data)
        guard normalized.rawCount <= FilterListTooLargeError.maxRules else {
            throw FilterListTooLargeError(ruleCount: normalized.rawCount)
        }

        let finalContent: String
        let preprocessedModified: Bool
        let hasIncludes: Bool
        if filter.isOptimizedBuiltin {
            finalContent = normalized.content
            preprocessedModified = false
            hasIncludes = false
        } else {
            let includeFailureTracker = IncludeFailureTracker()
            let preprocessor = FilterPreprocessor(
                urlSession: urlSession,
                onFetchError: { url, statusCode in
                    await includeFailureTracker.markFailed()
                    await onIncludeFetchError?(url, statusCode)
                }
            )
            (finalContent, preprocessedModified, hasIncludes) = await preprocessor.preprocessWithChangeFlag(
                content: normalized.content,
                listURL: sourceURL
            )
            try Task.checkCancellation()
            guard !(await includeFailureTracker.failed) else {
                throw ProcessingError.invalidContent
            }
        }
        let normalizedDigest = preprocessedModified ? DigestSupport.sha256Hex(normalized.content) : nil

        try Task.checkCancellation()
        guard FilterListContentValidator.appearsToBeFilterList(finalContent),
              let finalData = finalContent.data(using: .utf8) else {
            throw ProcessingError.invalidContent
        }

        let metadata = FilterListContentProcessing.parseMetadata(
            from: finalContent,
            sanitize: true
        )
        var updatedFilter = FilterListRemoteMetadataPolicy.applying(
            title: metadata.title,
            description: metadata.description,
            version: metadata.version,
            to: filter
        )
        updatedFilter.sourceRuleCount = preprocessedModified
            ? FilterList.countRules(in: finalContent)
            : normalized.rawCount
        updatedFilter.sourceSizeBytes = finalData.count
        updatedFilter.rawSourceRuleCount = normalized.rawCount
        updatedFilter.lastUpdated = Date()
        return PreparedSource(
            data: finalData,
            filter: updatedFilter,
            strippedDirectives: normalized.strippedDirectives,
            // Stored as the raw body, so the delta baseline keeps the exact input bytes.
            baselineData: normalized.hasDiffMetadata || hasIncludes ? data : nil,
            normalizedDigest: normalizedDigest,
            includeSource: hasIncludes ? sourceURL : nil
        )
    }

    private static func normalize(
        _ data: Data
    ) throws -> (content: String, rawCount: Int, strippedDirectives: [String], hasDiffMetadata: Bool) {
        guard let rawContent = String(data: data, encoding: .utf8) else {
            throw ProcessingError.decodingFailed
        }
        var strippedDirectives: [String] = []
        let content = FilterListContentProcessing.normalizedContent(from: rawContent) {
            if !strippedDirectives.contains($0) { strippedDirectives.append($0) }
        }
        return (
            content: content,
            rawCount: FilterList.countRules(in: content),
            strippedDirectives: strippedDirectives,
            hasDiffMetadata: FilterDiffUpdater.parseMetadata(from: rawContent) != nil
        )
    }
}
