import Foundation
@testable import wBlockCoreService

@main
@MainActor
struct WebExtensionBatchedStateTests {
    private static func fail(_ message: String) -> Never {
        fputs("FAIL: \(message)\n", stderr)
        exit(1)
    }

    private static func expect(_ condition: @autoclosure () -> Bool, _ message: String) {
        if !condition() {
            fail(message)
        }
    }

    private static func send(_ message: [String: Any]) async -> [String: Any] {
        await withCheckedContinuation { continuation in
            WebExtensionRequestHandler.respond(to: message) { reply in
                continuation.resume(returning: reply as? [String: Any] ?? [:])
            }
        }
    }

    static func main() async throws {
        let root = FileManager.default.temporaryDirectory
            .appendingPathComponent("wblock-batched-state-\(UUID().uuidString)", isDirectory: true)
        let scripts = root.appendingPathComponent("userscripts", isDirectory: true)
        let data = root.appendingPathComponent("data", isDirectory: true)
        try FileManager.default.createDirectory(at: scripts, withIntermediateDirectories: true)
        let pauseSuite = "test.wblock.batched.pause.\(UUID().uuidString)"
        defer {
            WebExtensionRequestHandler.pauseGroupIdentifierOverrideForTesting = nil
            WebExtensionRequestHandler.userScriptManagerOverrideForTesting = nil
            UserScriptManager.scriptsDirectoryOverrideForTesting = nil
            UserScriptManager.skipsStartupDownloadsForTesting = false
            UserDefaults().removePersistentDomain(forName: pauseSuite)
            try? FileManager.default.removeItem(at: root)
        }

        WebExtensionRequestHandler.pauseGroupIdentifierOverrideForTesting = pauseSuite
        BlockingPauseStore.setPausedComponents([], groupIdentifier: pauseSuite)

        UserScriptManager.scriptsDirectoryOverrideForTesting = scripts
        UserScriptManager.skipsStartupDownloadsForTesting = true

        let scriptSource = """
        // ==UserScript==
        // @name Batched Popup Probe
        // @match *://example.com/*
        // ==/UserScript==
        window.__batchedProbe = true;
        """
        var script = UserScript(name: "Batched Popup Probe", content: scriptSource)
        script.parseMetadata()
        script.isLocal = true
        script.isEnabled = true

        let appData = ProtobufDataManager.makeIsolatedForTesting(dataDirectoryURL: data)
        await appData.loadData()
        _ = await appData.replaceUserScripts([script])
        try scriptSource.write(
            to: scripts.appendingPathComponent("\(script.id.uuidString).user.js"),
            atomically: true,
            encoding: .utf8
        )
        let manager = UserScriptManager.makeIsolatedForTesting(dataManager: appData)
        await manager.waitUntilReady()
        WebExtensionRequestHandler.userScriptManagerOverrideForTesting = manager

        // 1. getPopupState returns all popup domains in a single native reply.
        let popupWithStatus = await send([
            "action": "getPopupState",
            "host": "example.com",
            "url": "https://example.com/page",
            "includeFilterUpdateStatus": true
        ])
        expect(popupWithStatus["ok"] as? Bool == true, "getPopupState returns ok: true")

        let pauseState = popupWithStatus["pauseState"] as? [String: Any]
        expect(pauseState?["paused"] is Bool, "getPopupState includes pauseState.paused")
        expect(pauseState?["filtersPaused"] is Bool, "getPopupState includes pauseState.filtersPaused")
        expect(pauseState?["userScriptsPaused"] is Bool, "getPopupState includes pauseState.userScriptsPaused")
        expect(pauseState?["elementZapperPaused"] is Bool, "getPopupState includes pauseState.elementZapperPaused")
        expect(pauseState?["resumeAvailable"] is Bool, "getPopupState includes pauseState.resumeAvailable")

        let siteState = popupWithStatus["siteState"] as? [String: Any]
        expect(siteState?["disabled"] is Bool, "getPopupState includes siteState.disabled")
        expect(siteState?["whitelisted"] is Bool, "getPopupState includes siteState.whitelisted")
        expect(siteState?["allDisabled"] is Bool, "getPopupState includes siteState.allDisabled")

        let zapperState = popupWithStatus["zapperState"] as? [String: Any]
        expect(zapperState?["ok"] as? Bool == true, "getPopupState includes zapperState.ok")
        expect(zapperState?["rules"] is [String], "getPopupState includes zapperState.rules")
        expect(zapperState?["inheritedRules"] is [String], "getPopupState includes zapperState.inheritedRules")
        expect(zapperState?["disabled"] is Bool, "getPopupState includes zapperState.disabled")
        expect(zapperState?["paused"] is Bool, "getPopupState includes zapperState.paused")

        let noAutoplayState = popupWithStatus["noAutoplayState"] as? [String: Any]
        expect(noAutoplayState?["enabled"] is Bool, "getPopupState includes noAutoplayState.enabled")
        expect(noAutoplayState?["siteAllowed"] is Bool, "getPopupState includes noAutoplayState.siteAllowed")
        expect(noAutoplayState?["globalEnabled"] is Bool, "getPopupState includes noAutoplayState.globalEnabled")
        expect(noAutoplayState?["active"] is Bool, "getPopupState includes noAutoplayState.active")

        let pageScripts = popupWithStatus["pageUserScripts"] as? [String: Any]
        let matched = pageScripts?["userScripts"] as? [[String: Any]]
        expect(pageScripts?["siteDisabled"] is Bool, "getPopupState includes pageUserScripts.siteDisabled")
        if (pauseState?["userScriptsPaused"] as? Bool) == false {
            expect(
                matched?.contains(where: { ($0["name"] as? String) == "Batched Popup Probe" }) == true,
                "getPopupState includes matched pageUserScripts"
            )
        }

        let updateStatus = popupWithStatus["filterUpdateStatus"] as? [String: Any]
        expect(updateStatus?["ok"] as? Bool == true && updateStatus?["state"] is String,
               "getPopupState includes filterUpdateStatus when requested")

        let popupWithoutStatus = await send([
            "action": "getPopupState",
            "host": "example.com",
            "url": "https://example.com/page",
            "includeFilterUpdateStatus": false
        ])
        expect(popupWithoutStatus["filterUpdateStatus"] == nil,
               "getPopupState omits filterUpdateStatus when not requested")

        // 2. getBlockingState returns anyPaused + zapper for non-empty hosts, omits zapper for empty host.
        let blockingForHost = await send([
            "action": "getBlockingState",
            "host": "example.com"
        ])
        expect(blockingForHost["disabled"] is Bool, "getBlockingState includes disabled")
        expect(blockingForHost["paused"] is Bool, "getBlockingState includes paused")
        expect(blockingForHost["anyPaused"] is Bool, "getBlockingState includes anyPaused")
        let blockingZapper = blockingForHost["zapper"] as? [String: Any]
        expect(blockingZapper?["ok"] as? Bool == true && blockingZapper?["rules"] is [String],
               "getBlockingState includes zapper snapshot for host")

        let blockingEmptyHost = await send([
            "action": "getBlockingState",
            "host": ""
        ])
        expect(blockingEmptyHost["disabled"] as? Bool == false, "empty host getBlockingState returns disabled: false")
        expect(blockingEmptyHost["paused"] as? Bool == false, "unpaused empty host getBlockingState returns paused: false")
        expect(blockingEmptyHost["anyPaused"] as? Bool == false, "unpaused empty host getBlockingState returns anyPaused: false")
        expect(blockingEmptyHost["zapper"] == nil, "empty host getBlockingState omits zapper")

        // 2b. Partial pause (userScripts only): getBlockingState reports paused == false, anyPaused == true.
        BlockingPauseStore.setPausedComponents(.userScripts, groupIdentifier: pauseSuite)
        let partialBlocking = await send([
            "action": "getBlockingState",
            "host": "example.com"
        ])
        expect(partialBlocking["paused"] as? Bool == false,
               "partial userscript pause keeps getBlockingState.paused == false")
        expect(partialBlocking["anyPaused"] as? Bool == true,
               "partial userscript pause sets getBlockingState.anyPaused == true")
        let partialPopup = await send([
            "action": "getPopupState",
            "host": "example.com",
            "url": "https://example.com/page",
            "includeFilterUpdateStatus": false
        ])
        let partialPauseState = partialPopup["pauseState"] as? [String: Any]
        expect(partialPauseState?["paused"] as? Bool == true, "partial pause reports pauseState.paused == true")
        expect(partialPauseState?["filtersPaused"] as? Bool == false, "partial pause reports filtersPaused == false")
        expect(partialPauseState?["userScriptsPaused"] as? Bool == true, "partial pause reports userScriptsPaused == true")
        let partialPageScripts = partialPopup["pageUserScripts"] as? [String: Any]
        let partialMatched = partialPageScripts?["userScripts"] as? [[String: Any]]
        expect(partialMatched?.isEmpty == true, "partial userscript pause omits pageUserScripts")
        BlockingPauseStore.setPausedComponents([], groupIdentifier: pauseSuite)

        // 3. InitContentScript with includeZapper piggybacks zapper even when includeUserScripts is false.
        let initReply = await send([
            "type": "InitContentScript",
            "includeUserScripts": false,
            "includeZapper": true,
            "payload": ["url": "https://example.com/page"]
        ])
        let initZapper = initReply["zapper"] as? [String: Any]
        expect(initZapper?["ok"] as? Bool == true && initZapper?["rules"] is [String],
               "InitContentScript with includeZapper returns zapper snapshot")

        print("PASS: WebExtensionRequestHandler batched popup, blocking, and init zapper state tests passed")
    }
}
