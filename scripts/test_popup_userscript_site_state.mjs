// Exercises popup initialization and refresh behavior for userscript site state.
// Run: node scripts/test_popup_userscript_site_state.mjs

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const popupPath = path.join(repoRoot, "wBlock Scripts (iOS)", "Resources", "pages", "popup", "popup.js");
let popupSource = readFileSync(popupPath, "utf8");
popupSource = popupSource.replace(
  "const load = refreshUi();",
  "const load = globalThis.__popupInitPromise = refreshUi();"
);

let failures = 0;
const check = (name, condition) => {
  console.log(`${condition ? "PASS" : "FAIL"}: ${name}`);
  if (!condition) failures += 1;
};

function makeClassList() {
  const classes = new Set();
  return {
    add(...names) { for (const name of names) classes.add(name); },
    remove(...names) { for (const name of names) classes.delete(name); },
    contains(name) { return classes.has(name); },
    toggle(name, force) {
      const enabled = force === undefined ? !classes.has(name) : Boolean(force);
      if (enabled) classes.add(name);
      else classes.delete(name);
      return enabled;
    },
    toString() { return [...classes].join(" "); },
  };
}

function makeElement(tagName = "div", id = "") {
  const listeners = new Map();
  const attributes = new Map();
  const element = {
    id,
    tagName: tagName.toUpperCase(),
    localName: tagName.toLowerCase(),
    hidden: false,
    disabled: false,
    checked: false,
    textContent: "",
    className: "",
    type: "",
    href: "",
    htmlFor: "",
    children: [],
    parentNode: null,
    dataset: {},
    style: {},
    scrollTop: 0,
    classList: makeClassList(),
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
      if (name === "id") this.id = String(value);
      if (name === "class") this.className = String(value);
      if (name.startsWith("data-")) {
        const key = name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        this.dataset[key] = String(value);
      }
    },
    getAttribute(name) {
      if (name === "id") return this.id || null;
      if (name === "class") return this.className || null;
      return attributes.get(name) ?? null;
    },
    removeAttribute(name) {
      attributes.delete(name);
      if (name === "aria-busy") delete this.dataset.ariaBusy;
    },
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    removeEventListener(type, listener) {
      listeners.set(type, (listeners.get(type) || []).filter((candidate) => candidate !== listener));
    },
    dispatchEvent(event) {
      event.target ??= this;
      event.currentTarget = this;
      for (const listener of listeners.get(event.type) || []) listener.call(this, event);
      if (event.bubbles !== false && this.parentNode) this.parentNode.dispatchEvent(event);
      return true;
    },
    contains(candidate) {
      for (let node = candidate; node; node = node.parentNode) {
        if (node === this) return true;
      }
      return false;
    },
    closest(selector) {
      for (let node = this; node; node = node.parentNode) {
        if (selector === "input.userscript-toggle") {
          const classes = String(node.className || "").split(/\s+/);
          if (node.localName === "input" && classes.includes("userscript-toggle")) return node;
        }
        if (selector === "button.rule-delete") {
          const classes = String(node.className || "").split(/\s+/);
          if (node.localName === "button" && classes.includes("rule-delete")) return node;
        }
        if (selector === "button.command-btn") {
          const classes = String(node.className || "").split(/\s+/);
          if (node.localName === "button" && classes.includes("command-btn")) return node;
        }
      }
      return null;
    },
    focus() {},
  };
  Object.defineProperty(element, "innerHTML", {
    set() { element.innerHTMLSets = (element.innerHTMLSets || 0) + 1; element.children = []; },
    get() { return ""; },
  });
  return element;
}

const documentListeners = new Map();
const elements = new Map();
const requiredIds = [
  "blocking-status",
  "enable-toggle",
  "site-enabled-toggle",
  "userscripts-site-toggle",
  "error",
  "filter-update-status",
  "no-autoplay-enabled-toggle",
  "no-autoplay-site-row",
  "no-autoplay-site-toggle",
  "paused-prompt",
  "paused-prompt-message",
  "paused-prompt-title",
  "resume-blocking",
  "site-host",
  "update-filters",
  "userscript-commands",
  "userscripts-count",
  "userscripts-empty",
  "userscripts-list",
  "userscripts-panel",
  "userscripts-section",
  "userscripts-toggle",
  "zapper-activate",
  "zapper-clear",
  "zapper-count",
  "zapper-enabled-toggle",
  "zapper-rules",
  "zapper-rules-panel",
  "zapper-rules-toggle",
];
for (const id of requiredIds) elements.set(id, makeElement("div", id));
for (const id of ["enable-toggle", "no-autoplay-enabled-toggle", "no-autoplay-site-toggle", "userscripts-toggle", "zapper-enabled-toggle"]) {
  elements.get(id).localName = "input";
  elements.get(id).tagName = "INPUT";
}
for (const id of ["resume-blocking", "update-filters", "zapper-activate", "zapper-clear", "zapper-rules-toggle"]) {
  elements.get(id).localName = "button";
  elements.get(id).tagName = "BUTTON";
}
elements.get("userscripts-panel").hidden = true;
elements.get("zapper-rules-panel").hidden = true;

const storage = new Map();
const nativeMessages = [];
const runtimeMessages = [];
const tabMessages = [];
const reloads = [];
const siteScripts = [
  { id: "script-enabled", name: "Enabled Script", disabledForSite: false, running: true },
  { id: "script-disabled", name: "Disabled Script", disabledForSite: true, running: false },
];

let componentsDisabled = false;
let filterDisabled = true;
let whitelisted = false;
let paused = false;
let rejectCombined = false;
let relayAsleep = false;
let failAfterCombinedSave = false;
let combinedApplyWarning = false;
let zapperMutationResponse = { ok: true, disabled: true };
let zapperRules = [];
let noAutoplayGlobalEnabled = true;
let noAutoplaySiteAllowedOverride = null;
let siteStateHook = null;
const tabListeners = { activated: [], updated: [] };
const sandbox = {
  browser: {
    i18n: { getMessage: () => "" },
    runtime: {
      getPlatformInfo: async () => ({ os: "mac" }),
      sendMessage: async (message) => {
        runtimeMessages.push(message);
        if (message?.action === "wblock:popup:nativeMessage") {
          if (relayAsleep) return undefined;
          return { ok: true, response: await nativeHandler(message.message) };
        }
        if (message?.action === "wblock:filterUpdate:getStatus") return { ok: true, state: "idle" };
        if (message?.action === "wblock:installRemoveParamDNRRules") return { ok: true };
        if (message?.action === "wblock:menu:getCommands") return { ok: true, commands: [] };
        if (message?.action === "wblock:zapper:getRules") return { ok: true, rules: zapperRules.slice(), disabled: componentsDisabled };
        if (message?.action === "wblock:clearCache") return { ok: true };
        return { ok: true };
      },
      sendNativeMessage: async (_host, message) => {
        if (!relayAsleep) throw new Error("Native messaging is unavailable in the popup");
        return nativeHandler(message);
      },
      testNativeHandler: async (message) => {
        nativeMessages.push(message);
        if (message?.action === "getPopupState") {
          const siteState = siteStateHook
            ? await siteStateHook(message)
            : { disabled: filterDisabled, whitelisted, allDisabled: whitelisted || componentsDisabled };
          const siteAllowed = noAutoplaySiteAllowedOverride ?? componentsDisabled;
          const payload = {
            ok: true,
            pauseState: { paused, filtersPaused: paused, userScriptsPaused: paused, elementZapperPaused: paused, resumeAvailable: false },
            siteState,
            zapperState: { ok: true, rules: zapperRules.slice(), disabled: componentsDisabled },
            noAutoplayState: { enabled: !siteAllowed, siteAllowed, globalEnabled: noAutoplayGlobalEnabled },
            pageUserScripts: { siteDisabled: componentsDisabled, userScripts: siteScripts.map((script) => ({ ...script })) },
          };
          if (message.includeFilterUpdateStatus) {
            payload.filterUpdateStatus = { ok: true, state: "idle" };
          }
          return payload;
        }
        if (message?.action === "getBlockingPausedState") {
          return { paused, filtersPaused: paused, userScriptsPaused: paused, elementZapperPaused: paused, resumeAvailable: false };
        }
        if (message?.action === "getSiteFilterDisabledState" && siteStateHook) return siteStateHook(message);
        if (message?.action === "getSiteFilterDisabledState") return { disabled: filterDisabled, whitelisted, allDisabled: whitelisted || componentsDisabled };
        if (message?.action === "getPageUserScripts") return { siteDisabled: componentsDisabled, userScripts: siteScripts.map((script) => ({ ...script })) };
        if (message?.action === "getZapperRules") return { ok: true, rules: zapperRules.slice(), disabled: componentsDisabled };
        if (message?.action === "getNoAutoplayState") {
          const siteAllowed = noAutoplaySiteAllowedOverride ?? componentsDisabled;
          return { enabled: !siteAllowed, siteAllowed, globalEnabled: noAutoplayGlobalEnabled };
        }
        if (message?.action === "setNoAutoplaySiteAllowed") {
          noAutoplaySiteAllowedOverride = message.allowed === true;
          return {
            ok: true,
            enabled: !noAutoplaySiteAllowedOverride,
            siteAllowed: noAutoplaySiteAllowedOverride,
            globalEnabled: noAutoplayGlobalEnabled,
          };
        }
        if (message?.action === "setAllSiteComponentsDisabled") {
          if (rejectCombined) return { ok: false, error: "Save failed" };
          componentsDisabled = filterDisabled = message.disabled;
          if (failAfterCombinedSave) throw new Error("Response lost after save");
          return { ok: true, disabled: componentsDisabled, requiresFullApply: combinedApplyWarning };
        }
        if (message?.action === "setSiteFilterDisabledState") {
          filterDisabled = message.disabled;
          componentsDisabled = false;
          return { disabled: filterDisabled };
        }
        if (message?.action === "setUserScriptSiteDisabledState") return { ok: true };
        if (message?.action === "setSiteZapperDisabled") return zapperMutationResponse;
        return { ok: true };
      },
    },
    tabs: {
      query: async () => [{ id: 9, url: "https://example.com/page", active: true }],
      get: async () => ({ id: 9, url: "https://example.com/page", active: true }),
      sendMessage: async (tabId, message, options) => {
        tabMessages.push({ tabId, message, options });
        if (message?.type === "wblock:pageSupportProbe") return { ok: true, protocol: "https:", host: "example.com" };
        return { ok: true };
      },
      reload: async (tabId, options) => { reloads.push({ tabId, options }); },
      onActivated: { addListener: (listener) => tabListeners.activated.push(listener) },
      onUpdated: { addListener: (listener) => tabListeners.updated.push(listener) },
    },
    storage: {
      local: {
        get: async (keys) => {
          if (keys === null) return Object.fromEntries(storage.entries());
          const wanted = Array.isArray(keys) ? keys : [keys];
          return Object.fromEntries(wanted.map((key) => [key, storage.get(key)]));
        },
        set: async (values) => { for (const [key, value] of Object.entries(values)) storage.set(key, value); },
        remove: async (keys) => { for (const key of Array.isArray(keys) ? keys : [keys]) storage.delete(key); },
      },
    },
  },
  document: {
    hidden: false,
    activeElement: null,
    body: makeElement("body"),
    documentElement: makeElement("html"),
    getElementById: (id) => elements.get(id) ?? null,
    createElement: (tagName) => makeElement(tagName),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(type, listener) {
      if (!documentListeners.has(type)) documentListeners.set(type, []);
      documentListeners.get(type).push(listener);
    },
  },
  window: {
    innerHeight: 640,
    matchMedia: () => ({ matches: true, addEventListener() {} }),
    requestAnimationFrame: (fn) => fn(),
    addEventListener() {},
    close() {},
    location: { href: "" },
  },
  navigator: { userAgent: "Mac", platform: "MacIntel", maxTouchPoints: 0 },
  CSS: { supports: () => false },
  URL,
  console,
  setTimeout,
  clearTimeout,
  Promise,
  Array,
  Boolean,
  Date,
  Error,
  Map,
  Number,
  Object,
  RegExp,
  Set,
  String,
};
sandbox.globalThis = sandbox;
sandbox.requestAnimationFrame = sandbox.window.requestAnimationFrame;

const nativeHandler = sandbox.browser.runtime.testNativeHandler;
delete sandbox.browser.runtime.testNativeHandler;
vm.createContext(sandbox);
vm.runInContext(`${popupSource}\nglobalThis.__refreshPopupForTest = refreshUi;`, sandbox, { filename: "popup.js" });
for (const listener of documentListeners.get("DOMContentLoaded") || []) listener();
await sandbox.__popupInitPromise;

const rows = elements.get("userscripts-list").children;
const inputs = rows.map((row) => row.children[1].children[0]);
check("popup initialization requests batched popup state in 1 native message",
  nativeMessages.length === 1 && nativeMessages[0].action === "getPopupState" && nativeMessages[0].url === "https://example.com/page");
check("popup initialization does not trigger forced DNR sync",
  !runtimeMessages.some((m) => m?.action === "wblock:installRemoveParamDNRRules"));
check("popup initialization does not fetch filter update status separately",
  !runtimeMessages.some((m) => m?.action === "wblock:filterUpdate:getStatus"));
check("popup initialization renders userscripts list once",
  elements.get("userscripts-list").innerHTMLSets === 1);
check("userscript controls stay visible when the site is disabled", elements.get("userscripts-section").hidden === false && rows.length === 2);
check("userscript controls are configurable when site blocking is disabled", inputs.every((input) => input.disabled === false));
check("enabled per-script site state renders as checked", inputs[0].checked === true);
check("disabled per-script site state renders as unchecked", inputs[1].checked === false);
check("running count ignores scripts disabled for the site", elements.get("userscripts-count").textContent === "1");
check("content filtering still reflects the disabled site", elements.get("enable-toggle").checked === false);
check("whole-site switch stays on when only content filtering is disabled", elements.get("site-enabled-toggle").checked === true);

await sandbox.__refreshPopupForTest();
const refreshedInputs = elements.get("userscripts-list").children.map((row) => row.children[1].children[0]);
check("popup refresh keeps userscript controls configurable on disabled sites", refreshedInputs.every((input) => input.disabled === false));
check("popup refresh preserves per-script disabled state", refreshedInputs[0].checked === true && refreshedInputs[1].checked === false);

refreshedInputs[1].checked = true;
refreshedInputs[1].dispatchEvent({ type: "change" });
await new Promise((resolve) => setTimeout(resolve, 0));
await new Promise((resolve) => setTimeout(resolve, 0));

const toggleRequest = nativeMessages.find((message) => message.action === "setUserScriptSiteDisabledState");
check("userscript site toggle writes through native handler", toggleRequest?.scriptId === "script-disabled" && toggleRequest.host === "example.com" && toggleRequest.disabled === false);
check("successful userscript site toggle refreshes rendered state", elements.get("userscripts-list").children[1].children[1].children[0].checked === true);
check("userscript site toggle reloads the active tab", reloads.some((entry) => entry.tabId === 9));

check("popup loads without direct native messaging", elements.get("error").textContent === "");
await vm.runInContext("setSiteZapperDisabled('example.com', true)", sandbox);
check("zapper toggle persists the native acknowledgment", storage.get("wblock.zapperMeta.v1:example.com")?.disabled === true);
zapperMutationResponse = {};
let rejected = false;
try { await vm.runInContext("setSiteZapperDisabled('example.com', false)", sandbox); } catch { rejected = true; }
check("invalid zapper acknowledgment cannot overwrite cached state", rejected && storage.get("wblock.zapperMeta.v1:example.com")?.disabled === true);
zapperMutationResponse = { ok: true, disabled: false };
await vm.runInContext("setSiteZapperDisabled('example.com', false)", sandbox);
check("zapper can be re-enabled through the relay", storage.get("wblock.zapperMeta.v1:example.com")?.disabled === false);

relayAsleep = true;
storage.set("wblockConfigCacheV2", { engineTimestamp: 1, entries: [] });
const asleepState = await vm.runInContext("sendNativeMessage({ action: 'getBlockingPausedState' })", sandbox);
relayAsleep = false;
check("popup falls back to direct native when the relay has no listener", asleepState?.paused === false);
check("the fallback drops the persisted config cache", !storage.has("wblockConfigCacheV2"));

storage.set("wblock.zapperRules.v1:example.com", []);
zapperRules = [".ad", ".banner"];
await sandbox.__refreshPopupForTest();
check("popup renders authoritative zapper count even when local cache starts stale",
  elements.get("zapper-count").textContent === "2" && elements.get("zapper-clear").disabled === false);
storage.set("wblock.zapperRules.v1:example.com", [".stale"]);
zapperRules = [];
await sandbox.__refreshPopupForTest();
check("popup clears zapper count and disables Clear when authoritative rules are empty",
  elements.get("zapper-count").textContent === "0" && elements.get("zapper-clear").disabled === true);

noAutoplayGlobalEnabled = false;
noAutoplaySiteAllowedOverride = false;
await vm.runInContext("getNoAutoplayState('example.com')", sandbox);
check("getNoAutoplayState keeps global cache false when site overrides it to blocked",
  storage.get("wblock.noAutoplay.enabled.v1") === false && !storage.has("wblock.noAutoplayAllow.v1:example.com"));
await vm.runInContext("setNoAutoplaySiteAllowed('example.com', false)", sandbox);
check("setNoAutoplaySiteAllowed keeps global cache false when blocking site autoplay",
  storage.get("wblock.noAutoplay.enabled.v1") === false && !storage.has("wblock.noAutoplayAllow.v1:example.com"));

noAutoplayGlobalEnabled = true;
noAutoplaySiteAllowedOverride = true;
const noAutoplayBefore = nativeMessages.filter((m) => m.action === "getNoAutoplayState").length;
await vm.runInContext("getNoAutoplayState('example.com')", sandbox);
check("already-migrated getNoAutoplayState sends exactly 1 native message",
  nativeMessages.filter((m) => m.action === "getNoAutoplayState").length === noAutoplayBefore + 1);
check("getNoAutoplayState keeps global cache true when site overrides it to allowed",
  storage.get("wblock.noAutoplay.enabled.v1") === true && storage.get("wblock.noAutoplayAllow.v1:example.com") === true);
await vm.runInContext("setNoAutoplaySiteAllowed('example.com', true)", sandbox);
check("setNoAutoplaySiteAllowed keeps global cache true when allowing site autoplay",
  storage.get("wblock.noAutoplay.enabled.v1") === true && storage.get("wblock.noAutoplayAllow.v1:example.com") === true);
noAutoplaySiteAllowedOverride = null;

async function changeToggle(id, checked) {
  elements.get(id).checked = checked;
  elements.get(id).dispatchEvent({ type: "change" });
  for (let i = 0; i < 10; i += 1) await new Promise(resolve => setTimeout(resolve, 0));
}

await changeToggle("site-enabled-toggle", false);
check("whole-site switch uses one native mutation", nativeMessages.filter(m => m.action === "setAllSiteComponentsDisabled").length === 1);
check("whole-site off refreshes every component, with autoplay allowed", !elements.get("site-enabled-toggle").checked
  && !elements.get("enable-toggle").checked && !elements.get("userscripts-site-toggle").checked
  && !elements.get("zapper-enabled-toggle").checked && elements.get("no-autoplay-site-toggle").checked);
check("whole-site off reports Disabled", elements.get("blocking-status").textContent === "Disabled");
await changeToggle("site-enabled-toggle", true);
check("whole-site on restores all components, with autoplay blocked", elements.get("site-enabled-toggle").checked
  && elements.get("enable-toggle").checked && elements.get("userscripts-site-toggle").checked
  && elements.get("zapper-enabled-toggle").checked && !elements.get("no-autoplay-site-toggle").checked);
await changeToggle("enable-toggle", false);
check("independent content filtering keeps the whole-site switch on", elements.get("site-enabled-toggle").checked && !elements.get("enable-toggle").checked);
check("mixed state reports Active", elements.get("blocking-status").textContent === "Active");
rejectCombined = true;
await changeToggle("site-enabled-toggle", false);
check("failed combined save restores the authoritative switch and reports an error", elements.get("site-enabled-toggle").checked && elements.get("error").textContent.length > 0);
rejectCombined = false;
failAfterCombinedSave = true;
const reloadsBeforeLostResponse = reloads.length;
await changeToggle("site-enabled-toggle", false);
check("lost response reconciles committed whole-site state and reloads", !elements.get("site-enabled-toggle").checked && reloads.length > reloadsBeforeLostResponse);
failAfterCombinedSave = false;
combinedApplyWarning = true;
await changeToggle("site-enabled-toggle", true);
check("whole-site toggle preserves the content filtering apply warning", elements.get("error").textContent === "Open wBlock to finish applying filters.");
combinedApplyWarning = false;
whitelisted = true;
await sandbox.__refreshPopupForTest();
check("master-whitelisted hosts keep the combined switch off and locked", !elements.get("site-enabled-toggle").checked && elements.get("site-enabled-toggle").disabled);
whitelisted = false;
paused = true;
await sandbox.__refreshPopupForTest();
check("paused blocking locks the combined switch", elements.get("site-enabled-toggle").disabled);
paused = false;
sandbox.browser.tabs.query = async () => [{ id: 9, url: "about:blank", active: true }];
sandbox.browser.tabs.get = async () => ({ id: 9, url: "about:blank", active: true });
await sandbox.__refreshPopupForTest();
check("unsupported pages lock the combined switch", elements.get("site-enabled-toggle").disabled);

// An open popup follows the tab it belongs to.
const settle = () => new Promise((resolve) => setTimeout(resolve, 250));
const showTab = (url, id = 9, windowId = 1) => {
  sandbox.browser.tabs.query = async () => [{ id, url, active: true, windowId }];
  sandbox.browser.tabs.get = async () => ({ id, url, active: true, windowId });
};
const fireUpdated = (tabId, changeInfo, url) => {
  for (const listener of tabListeners.updated) listener(tabId, changeInfo, { id: tabId, url, active: true, windowId: 1 });
};
const fireActivated = (tabId, windowId) => {
  for (const listener of tabListeners.activated) listener({ tabId, windowId });
};

showTab("https://example.com/page");
await sandbox.__refreshPopupForTest();
showTab("https://other.test/a");
fireUpdated(9, { url: "https://other.test/a" }, "https://other.test/a");
await settle();
check("navigating the tab reloads the popup for the new host", elements.get("site-host").textContent === "other.test");
check("the reload asks native about the new page", nativeMessages.some((m) => m.action === "getPopupState" && m.url === "https://other.test/a"));

const loadsBefore = nativeMessages.filter((m) => m.action === "getPopupState").length;
fireUpdated(42, { url: "https://elsewhere.test/" }, "https://elsewhere.test/");
fireActivated(43, 2);
fireUpdated(9, { title: "Title only" }, "https://other.test/a");
await settle();
check("other tabs, other windows, and title changes leave the popup alone",
  nativeMessages.filter((m) => m.action === "getPopupState").length === loadsBefore);

showTab("https://switched.test/", 10);
fireActivated(10, 1);
await settle();
check("switching tabs in the popup's window reloads it", elements.get("site-host").textContent === "switched.test");

// A slow answer for the previous page must not overwrite the current one.
let releaseSlow;
siteStateHook = (message) => message.host === "slow.test"
  ? new Promise((resolve) => { releaseSlow = () => resolve({ disabled: true, whitelisted: true, allDisabled: true }); })
  : { disabled: false, whitelisted: false, allDisabled: false };
showTab("https://slow.test/", 10);
fireUpdated(10, { url: "https://slow.test/" }, "https://slow.test/");
await settle();
check("the controls stay locked while the new site's state loads", elements.get("enable-toggle").disabled && elements.get("zapper-enabled-toggle").disabled);
showTab("https://fast.test/", 10);
fireUpdated(10, { url: "https://fast.test/" }, "https://fast.test/");
await settle();
releaseSlow();
await settle();
check("a stale load cannot overwrite the newer host", elements.get("site-host").textContent === "fast.test");
check("a stale load cannot overwrite the newer site state", elements.get("enable-toggle").checked
  && !elements.get("enable-toggle").disabled && !elements.get("zapper-enabled-toggle").disabled
  && elements.get("blocking-status").textContent === "Active");
siteStateHook = null;

sandbox.document.hidden = true;
showTab("https://background.test/", 10);
fireUpdated(10, { status: "complete" }, "https://background.test/");
await settle();
check("a hidden popup does not reload", elements.get("site-host").textContent === "fast.test");
sandbox.document.hidden = false;
for (const listener of documentListeners.get("visibilitychange") || []) listener();
await settle();
check("a hidden popup catches up once shown", elements.get("site-host").textContent === "background.test");

// Legacy native host without getPopupState falls back to individual messages.
const prevRelay = sandbox.browser.runtime.sendMessage;
sandbox.browser.runtime.sendMessage = async (message) => {
  if (message?.action === "wblock:popup:nativeMessage" && message.message?.action === "getPopupState") {
    return { ok: true, response: { ok: true } };
  }
  return prevRelay(message);
};
const fallbackPausedBefore = nativeMessages.filter((m) => m.action === "getBlockingPausedState").length;
showTab("https://legacy.test/", 10);
await sandbox.__refreshPopupForTest();
check("legacy native host without getPopupState falls back cleanly",
  elements.get("site-host").textContent === "legacy.test"
    && nativeMessages.filter((m) => m.action === "getBlockingPausedState").length === fallbackPausedBefore + 1);
sandbox.browser.runtime.sendMessage = prevRelay;

// Malformed batched.siteState must lock site controls as unavailable instead of defaulting enabled.
siteStateHook = () => null;
showTab("https://malformed-site.test/", 10);
await sandbox.__refreshPopupForTest();
check("malformed batched siteState locks enable-toggle and reports Unavailable",
  elements.get("enable-toggle").disabled === true
    && elements.get("blocking-status").textContent === "Unavailable");
siteStateHook = null;

// A slow content-script reachability probe must not block primary popup rendering.
let releaseProbe;
const prevTabSendMessage = sandbox.browser.tabs.sendMessage;
const prevRuntimeRelay = sandbox.browser.runtime.sendMessage;
sandbox.browser.tabs.sendMessage = async (tabId, message, options) => {
  if (message?.type === "wblock:pageSupportProbe") {
    await new Promise((resolve) => { releaseProbe = resolve; });
    return { ok: true, protocol: "https:", host: "probe-async.test" };
  }
  return prevTabSendMessage(tabId, message, options);
};
sandbox.browser.runtime.sendMessage = async (message) => {
  if (message?.action === "wblock:menu:getCommands") {
    return { ok: true, commands: [{ bridgeId: "b1", commandId: "c1", caption: "Run Test Command", frameId: 0 }] };
  }
  return prevRuntimeRelay(message);
};
componentsDisabled = false;
filterDisabled = false;
showTab("https://probe-async.test/", 10);
const refreshPromise = sandbox.__refreshPopupForTest();
await new Promise((resolve) => setTimeout(resolve, 20));
check("primary popup state renders before slow pageSupportProbe finishes",
  typeof releaseProbe === "function"
    && elements.get("site-host").textContent === "probe-async.test"
    && elements.get("blocking-status").textContent === "Active"
    && elements.get("enable-toggle").checked === true
    && elements.get("enable-toggle").disabled === false
    && elements.get("userscripts-list").children.length === siteScripts.length);
releaseProbe();
await refreshPromise;
check("userscript menu commands render after slow pageSupportProbe resolves",
  elements.get("userscript-commands").hidden === false
    && elements.get("userscript-commands").children.length === 1);

// Switching to another tab/host while the new probe is slow must immediately clear previous commands.
releaseProbe = null;
showTab("https://probe-next.test/", 11);
const nextRefreshPromise = sandbox.__refreshPopupForTest();
await new Promise((resolve) => setTimeout(resolve, 20));
check("switching tabs clears stale userscript menu commands before slow probe settles",
  typeof releaseProbe === "function"
    && elements.get("site-host").textContent === "probe-next.test"
    && elements.get("userscript-commands").hidden === true
    && elements.get("userscript-commands").children.length === 0);
releaseProbe();
await nextRefreshPromise;

sandbox.browser.tabs.sendMessage = prevTabSendMessage;
sandbox.browser.runtime.sendMessage = prevRuntimeRelay;

// A superseded popup refresh still renders global filterUpdateStatus without extra status IPC.
{
  let releaseFirstStatusPopup;
  let firstPopupCall = true;
  const statusCalls = [];
  const origRelay = sandbox.browser.runtime.sendMessage;
  sandbox.browser.runtime.sendMessage = async (message) => {
    if (message?.action === "wblock:popup:nativeMessage" && message.message?.action === "getPopupState") {
      if (firstPopupCall) {
        firstPopupCall = false;
        await new Promise((resolve) => { releaseFirstStatusPopup = resolve; });
        const res = await origRelay(message);
        if (res?.response) {
          res.response.filterUpdateStatus = { ok: true, state: "failed", error: "Update download timed out." };
        }
        return res;
      }
      return origRelay(message);
    }
    if (message?.action === "wblock:filterUpdate:getStatus") {
      statusCalls.push(message);
      return { ok: true, state: "idle" };
    }
    return origRelay(message);
  };
  showTab("https://status-race-1.test/", 12);
  const firstStatusLoad = sandbox.__refreshPopupForTest();
  await new Promise((resolve) => setTimeout(resolve, 10));
  showTab("https://status-race-2.test/", 13);
  const secondStatusLoad = sandbox.__refreshPopupForTest();
  await secondStatusLoad;
  releaseFirstStatusPopup();
  await firstStatusLoad;
  const statusEl = elements.get("filter-update-status");
  check("superseded popup refresh still renders global filter-update failure without extra status IPC",
    statusCalls.length === 0
      && statusEl.hidden === false
      && statusEl.classList.contains("is-error")
      && statusEl.textContent === "Update download timed out.");
  sandbox.browser.runtime.sendMessage = origRelay;
}

if (failures > 0) process.exitCode = 1;
