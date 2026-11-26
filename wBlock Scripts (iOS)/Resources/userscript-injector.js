/*! Generated artifact — do not edit. Edit extension-src/userscript-injector.js and run scripts/minify-extension-js.sh */
(()=>{const F=(i,l)=>{i.addListener(l),window.addEventListener("pagehide",()=>i.removeListener(l)),window.addEventListener("pageshow",e=>{e.persisted&&i.addListener(l)})};var I=!1,k="__wblock_warm_start_v1",z=1800*1e3,P=4,L=2*1024*1024,C="https://raw.githubusercontent.com/0xCUB3/wBlock-userscripts/main/packages/dark-reader/dist/dark-reader.user.js";function U(){var i=null;try{i=localStorage.getItem(k)}catch{}if(i!==null)return i;try{i=sessionStorage.getItem(k)}catch{}return i}function K(i){try{localStorage.
setItem(k,i)}catch{}try{sessionStorage.removeItem(k)}catch{}}function v(){try{localStorage.removeItem(k)}catch{}try{sessionStorage.removeItem(k)}catch{}}var c=(...i)=>{I&&console.log(...i)},p=(...i)=>{I&&console.warn(...i)},_=(...i)=>{console.error(...i)};function m(i){return typeof i!="string"?"":i.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/`/g,"\\`").replace(/\n/g,"\\n").replace(/\r/g,"\\r").replace(/\$\{/g,"\\${")}const G="wblock.tubeCleaner.sponsorBlock",q="wblock\
.tubeCleaner.quality",H=new Set(["auto","hd2160","hd1440","hd1080","hd720","large","medium","small","tiny"]);function N(i){return typeof i=="string"&&H.has(i)?i:null}function M(i){return i&&i.isLocal===!1&&i.sourceURL==="https://raw.githubusercontent.com/0xCUB3/wBlock-userscripts/main/packages/tube-cleaner/dist/tube-cleaner.user.js"&&/(^|\.)youtube\.com$/i.test(location.hostname)&&location.protocol==="https:"&&(i.grant||[]).every(l=>["none","unsafewindow","gm_info","gm.info","gm_getvalue","gm.ge\
tvalue","gm_setvalue","gm.setvalue"].includes(String(l).toLowerCase()))}function V(i){const l=(i.grant||[]).map(e=>String(e).toLowerCase());return i.injectInto!=="content"&&l.includes("unsafewindow")&&l.every(e=>["none","unsafewindow","gm_info","gm.info","gm_xmlhttprequest","gm.xmlhttprequest"].includes(e))}const J=new Set(["release","beta"].map(i=>`https://userscripts.adtidy.org/${i}/popup-blocker/2.5/popupblocker.user.js`)),T=/^[A-Za-z0-9+/=]{1,64}$/;function b(i){return i&&i.isLocal===!1&&J.has(
i.sourceURL)&&(i.grant||[]).every(l=>["unsafewindow","gm_getvalue","gm_setvalue","gm_deletevalue","gm_listvalues","gm_getresourceurl"].includes(String(l).toLowerCase()))}function Y(){return location.protocol==="https:"&&location.hostname==="popupblocker.adguard.com"&&/\/options\.html$/.test(location.pathname||"")}function x(i){return typeof i!="string"||i.length>65536?null:[...new Set(i.toLowerCase().split(","))].filter(l=>/^[a-z0-9.-]{1,253}$/.test(l)).slice(0,2e3)}function j(i){const l={};for(const e of[
"allowed","silenced","#id"])try{const t=JSON.parse((i||{})[e]);(e==="#id"?typeof t=="string"&&T.test(t):x(t))&&(l[e]=e==="#id"?t:x(t).join(","))}catch{}return l}function Q(i){if(M(i)){const l={},e=i.storageSnapshot||{};try{const t=W(JSON.parse(e[G]));t&&(l[G]=JSON.stringify(t))}catch{}try{const t=N(JSON.parse(e[q]));t&&(l[q]=JSON.stringify(t))}catch{}return l}return b(i)?Object.fromEntries([["ver","3"],...Object.entries(j(i.storageSnapshot))].map(([l,e])=>[l,JSON.stringify(e)])):{}}function A(i){
return!M(i)&&!b(i)&&!V(i)&&(i.grant||[]).some(l=>{const e=String(l).toLowerCase();return e.startsWith("gm")&&e!=="gm_info"&&e!=="gm.info"})}function W(i){if(!i||typeof i!="object"||Array.isArray(i))return null;const l=["enabled","showNotice","minimumDuration","modes","excludedChannels"];if(Object.keys(i).some(n=>!l.includes(n))||typeof i.enabled!="boolean"||typeof i.showNotice!="boolean"||!Number.isFinite(i.minimumDuration)||i.minimumDuration<0||i.minimumDuration>86400||!i.modes||typeof i.modes!=
"object"||Array.isArray(i.modes)||!Array.isArray(i.excludedChannels)||i.excludedChannels.length>200)return null;const e=["sponsor","selfpromo","interaction","intro","outro","preview","filler","music_offtopic"];if(Object.keys(i.modes).some(n=>!e.includes(n)))return null;const t={};for(const n of e){if(!["auto","ask","off"].includes(i.modes[n]))return null;t[n]=i.modes[n]}return i.excludedChannels.some(n=>typeof n!="string"||n.length>=200)?null:{enabled:i.enabled,showNotice:i.showNotice,minimumDuration:i.
minimumDuration,modes:t,excludedChannels:i.excludedChannels.slice()}}var E=null;function R(){if(E)return E;try{const i=document.querySelector("script[nonce]"),l=i&&(i.nonce||i.getAttribute("nonce"))||"";return l&&(E=l),l||""}catch{return""}}function O(){return!1}if(window.wBlockUserscriptInjectorHasRun)c("[wBlock] Userscript injector already ran in this frame.");else{window.wBlockUserscriptInjectorHasRun=!0,c("[wBlock] Initializing Userscript Injector for this frame.");class i{constructor(){this.
injectedScripts=new Set,this.injectingScripts=new Map,this.scriptInjections=new Map,this.pendingScripts=[],this.messageListenerAttached=!1,this.extensionContextAvailable=!1,this.extensionContextUnavailableLogged=!1,this.pendingNativeRequests=new Map,this.pageMenuBridgeElements=new Map,this.contentMenuCommandCallbacks=new Map,this.registeredMenuCommands=new Map,this.pendingMenuInvocations=new Map,this.scriptPayloadPromises=new Map,this.warmStartValidationPromises=new Map,this.validationPrefetches=
new Map,this.documentStartRequestGeneration=0,this.documentRootPromise=null,this.rydPrefetchEnabled=!1,this.menuCommandSequence=0,this.userScriptRequestRetryDelays=[250,500,1e3,1e3,1e3,1e3,2e3,2e3,2e3,2e3,2e3],this.pageHidden=!1,window.addEventListener("pagehide",()=>{this.pageHidden=!0,this.invalidatePendingScripts()}),window.addEventListener("pageshow",e=>{e.persisted&&(this.pageHidden=!1,this.requestUserScripts())}),c("[wBlock] UserScriptEngine constructor called."),this.init()}init(){if(c("[\
wBlock] UserScriptEngine init."),this.setupMessageListener(),!this.extensionContextAvailable)return;const e=this.loadWarmStartScripts();e?e.catch(t=>p("[wBlock] Warm-start integrity check failed:",t)).finally(()=>this.requestUserScripts()):this.requestUserScripts()}invalidatePendingScripts(){return this.pendingScripts=[],this.scriptPayloadPromises.clear(),this.warmStartValidationPromises.clear(),this.validationPrefetches.clear(),this.injectingScripts.clear(),this.scriptInjections.clear(),++this.
documentStartRequestGeneration}invalidateDocumentStartSessionCache(){const e=this.invalidatePendingScripts();this.tubeCleanerSettingsScript=null,this.popupBlockerScript=null,this.pendingPageWrites?.clear(),this.requestUserScripts(0,e)}waitForDocumentRoot(){return document.documentElement?Promise.resolve(document.documentElement):this.documentRootPromise?this.documentRootPromise:(this.documentRootPromise=new Promise(e=>{let t=null;const n=()=>document.documentElement?(t&&t.disconnect(),e(document.
documentElement),!0):!1;n()||(typeof MutationObserver<"u"?(t=new MutationObserver(n),t.observe(document,{childList:!0}),n()):document.addEventListener("DOMContentLoaded",n,{once:!0}))}),this.documentRootPromise)}inlinePageScriptsCanRun(){const e=`data-wblock-inline-${Math.random().toString(36).slice(2)}`,t=document.createElement("script");t.textContent=`document.documentElement.setAttribute('${e}', '1')`,document.documentElement.appendChild(t),t.remove();const n=document.documentElement.getAttribute(
e)==="1";return document.documentElement.removeAttribute(e),n}waitForCspNonce(e=1500){const t=R();return t?Promise.resolve(t):new Promise(n=>{const o=()=>{const a=R();return a?(r.disconnect(),clearTimeout(s),n(a),!0):!1},r=new MutationObserver(o);r.observe(document,{childList:!0,subtree:!0});const s=setTimeout(()=>{r.disconnect(),n("")},e);o()})}setupStorageBridge(){this.tubeCleanerSettingsScript=null,this.popupBlockerScript=null,this.pendingPageWrites=new Map,this.pageWritesFlushing=!1,window.addEventListener(
"message",e=>{if(e.source!==window||!e.data)return;const t=e.data.type==="wblock:tube-preferences"?this.tubePreferenceWrite(e.data):e.data.type==="wblock:popup-blocker-storage"?this.popupBlockerWrite(e.data):null;t&&(this.pendingPageWrites.set(t.key,{...t,generation:this.documentStartRequestGeneration}),this.pageWritesFlushing||this.flushPageWrites())})}tubePreferenceWrite(e){const t=this.tubeCleanerSettingsScript;if(!t||!M(t))return null;if(Object.prototype.hasOwnProperty.call(e,"quality")&&!Object.
prototype.hasOwnProperty.call(e,"settings")){const o=N(e.quality);return o?{script:t,key:q,rawValue:JSON.stringify(o)}:null}const n=W(e.settings);return n?{script:t,key:G,rawValue:JSON.stringify(n)}:null}popupBlockerWrite(e){const t=this.popupBlockerScript;if(!t||!b(t)||typeof e.rawValue!="string")return null;let n;try{n=JSON.parse(e.rawValue)}catch{return null}const o=this.popupBlockerState;if(e.key==="#id"){if(o["#id"]||typeof n!="string"||!T.test(n))return null;o["#id"]=n}else if(e.key==="all\
owed"||e.key==="silenced"){const r=x(n);if(!r)return null;if(Y())o[e.key]=r.join(",");else{const s=location.hostname.toLowerCase(),a=x(o[e.key]||"").filter(u=>u!==s);o[e.key]=(r.includes(s)?[...a,s]:a).join(",")}}else return null;return{script:t,key:e.key,rawValue:JSON.stringify(o[e.key])}}async flushPageWrites(){this.pageWritesFlushing=!0;try{for(let e;e=this.pendingPageWrites.values().next().value;)if(this.pendingPageWrites.delete(e.key),e.generation===this.documentStartRequestGeneration){try{
await this.sendNativeRequest("setUserScriptStorageValue",{scriptId:e.script.id,key:e.key,rawValue:e.rawValue})}catch{}await new Promise(t=>setTimeout(t,250))}}finally{this.pageWritesFlushing=!1}}setupMenuCommandBridge(){window.__wBlockMenuCommandBridge={registerMenuCommand:(e,t,n,o)=>{if(typeof o!="function")return;let r=this.contentMenuCommandCallbacks.get(e);r||(r=new Map,this.contentMenuCommandCallbacks.set(e,r)),r.set(t,o),this.registerMenuCommandDescriptor(e,t,n)},unregisterMenuCommand:(e,t)=>{
const n=this.contentMenuCommandCallbacks.get(e);n&&(n.delete(t),n.size===0&&this.contentMenuCommandCallbacks.delete(e)),this.unregisterMenuCommandDescriptor(e,t)}},window.__wBlockUserscriptMenuState=this.getRegisteredMenuCommands(),window.addEventListener("pagehide",()=>{this.pageMenuBridgeElements.clear(),this.contentMenuCommandCallbacks.clear(),this.registeredMenuCommands.clear(),window.__wBlockUserscriptMenuState=[],this.syncMenuCommandsToBackground()},{once:!0})}registerMenuCommandDescriptor(e,t,n={}){
if(typeof e!="string"||typeof t!="string")return;const o=this.registeredMenuCommands.get(e)||new Map,r=o.get(t);o.set(t,{bridgeId:e,commandId:t,caption:typeof n.caption=="string"?n.caption:"",title:typeof n.title=="string"?n.title:"",accessKey:typeof n.accessKey=="string"?n.accessKey:"",scriptName:typeof n.scriptName=="string"?n.scriptName:"",sortOrder:r?r.sortOrder:++this.menuCommandSequence}),this.registeredMenuCommands.set(e,o),this.syncMenuCommandsToBackground()}unregisterMenuCommandDescriptor(e,t){
if(typeof e!="string"||typeof t!="string")return;const n=this.registeredMenuCommands.get(e);n&&(n.delete(t),n.size===0&&this.registeredMenuCommands.delete(e),this.syncMenuCommandsToBackground())}syncMenuCommandsToBackground(){const e=this.getRegisteredMenuCommands();window.__wBlockUserscriptMenuState=e,typeof browser<"u"&&browser.runtime&&browser.runtime.sendMessage&&browser.runtime.sendMessage({action:"wblock:menu:updateFrameCommands",commands:e}).catch(t=>{p("[wBlock] Failed to sync menu comma\
nds to background:",t)})}attachPageMenuCommandBridge(e,t){const n=t&&t.menuBridgeId;!n||!e||(e.setAttribute("data-wblock-menu-bridge",n),this.pageMenuBridgeElements.set(n,e),e.addEventListener("wblock-gm-menu-register",o=>{const r=o&&o.detail?o.detail:{};r.bridgeId!==n||typeof r.commandId!="string"||typeof r.caption!="string"||this.registerMenuCommandDescriptor(n,r.commandId,r)}),e.addEventListener("wblock-gm-menu-unregister",o=>{const r=o&&o.detail?o.detail:{};r.bridgeId!==n||typeof r.commandId!=
"string"||this.unregisterMenuCommandDescriptor(n,r.commandId)}),e.addEventListener("wblock-gm-menu-invoke-result",o=>{const r=o&&o.detail?o.detail:{};if(r.bridgeId!==n||typeof r.requestId!="string")return;const s=this.pendingMenuInvocations.get(r.requestId);s&&(this.pendingMenuInvocations.delete(r.requestId),clearTimeout(s.timeoutId),s.resolve({ok:r.success!==!1,error:typeof r.error=="string"?r.error:""}))}))}getRegisteredMenuCommands(){const e=[];return this.registeredMenuCommands.forEach(t=>{t.
forEach(n=>{e.push(n)})}),e.sort((t,n)=>t.sortOrder-n.sortOrder),e.map(({bridgeId:t,commandId:n,caption:o,title:r,accessKey:s,scriptName:a,sortOrder:u})=>({bridgeId:t,commandId:n,caption:o,title:r,accessKey:s,scriptName:a,sortOrder:u}))}async invokeMenuCommand(e,t){if(typeof e!="string"||typeof t!="string")return{ok:!1,error:"Invalid menu command request"};const n=this.contentMenuCommandCallbacks.get(e);if(n&&n.has(t))try{return await Promise.resolve(n.get(t)()),{ok:!0,error:""}}catch(s){return{
ok:!1,error:s&&s.message?s.message:String(s)}}const o=this.pageMenuBridgeElements.get(e);if(!o)return{ok:!1,error:"Menu command not found"};const r=this.generateRequestId("gmmenuinvoke");return await new Promise(s=>{const a=setTimeout(()=>{this.pendingMenuInvocations.delete(r),s({ok:!1,error:"Menu command timed out"})},15e3);this.pendingMenuInvocations.set(r,{resolve:s,timeoutId:a}),o.dispatchEvent(new CustomEvent("wblock-gm-menu-invoke",{detail:{bridgeId:e,commandId:t,requestId:r}}))})}generateRequestId(e){
return`${e}-${Date.now()}-${Math.random().toString(36).slice(2)}`}generateSecret(e){const t=new Uint8Array(16);if(typeof crypto<"u"&&typeof crypto.getRandomValues=="function")crypto.getRandomValues(t);else for(let o=0;o<t.length;o+=1)t[o]=Math.floor(Math.random()*256);let n="";for(let o=0;o<t.length;o+=1)n+=t[o].toString(16).padStart(2,"0");return`${e}-${n}`}async sendNativeRequest(e,t={}){if(e==="getUserScripts"&&globalThis.__wblockFrameInitialization){const r=globalThis.__wblockFrameInitialization;
delete globalThis.__wblockFrameInitialization;const s=await r;if(s)return{userScripts:s.userScripts||[],error:s.userScriptsError||s.error}}const n=t.requestId||this.generateRequestId(e),o={...t,requestId:n};if(typeof browser<"u"&&browser.runtime&&browser.runtime.sendMessage){const r=await browser.runtime.sendMessage({action:e,...o});if(r===void 0)throw new Error(`[wBlock] No reply from the background: ${e}`);return r}if(typeof safari<"u"&&safari.extension&&safari.extension.dispatchMessage)return await new Promise(
(r,s)=>{const a=typeof e=="string"&&e.includes("Chunk")?12e4:15e3,u=setTimeout(()=>{this.pendingNativeRequests.delete(n),s(new Error(`[wBlock] Native request timeout: ${e}`))},a);this.pendingNativeRequests.set(n,{resolve:r,reject:s,timeoutId:u}),safari.extension.dispatchMessage(e,o)});throw new Error("[wBlock] No suitable messaging API found for native requests.")}getPreferredChunkSize(){return 512*1024}base64ToBytes(e){const t=atob(e),n=new Uint8Array(t.length);for(let o=0;o<t.length;o++)n[o]=t.
charCodeAt(o);return n}concatBytes(e){const t=e.reduce((r,s)=>r+s.length,0),n=new Uint8Array(t);let o=0;for(const r of e)n.set(r,o),o+=r.length;return n}async fetchTextFromChunks(e,t){const n=new TextDecoder("utf-8"),o=this.getPreferredChunkSize(),r=await this.sendNativeRequest(e,{...t,chunkIndex:0,chunkSize:o});if(r&&r.error)throw new Error(r.error);const s=r&&typeof r.totalChunks=="number"?r.totalChunks:1;if(!Number.isInteger(s)||s<1||s>256)throw new Error("Invalid userscript chunk response");
const a=r&&r.payloadRevision;if(!Number.isSafeInteger(a)||a<0)throw new Error("Missing userscript payload revision");const u=new Array(s);if(!r||typeof r.chunk!="string")throw new Error("Missing userscript chunk data");u[0]=r.chunk;const d=6;let f=1;const h=async()=>{for(;;){const g=f++;if(g>=s)return;const y=await this.sendNativeRequest(e,{...t,chunkIndex:g,chunkSize:o,payloadRevision:a});if(y&&y.error)throw new Error(y.error);if(!y||typeof y.chunk!="string")throw new Error("Missing userscript \
chunk data");u[g]=y.chunk}},B=Math.min(d,Math.max(0,s-1)),S=[];for(let g=0;g<B;g++)S.push(h());await Promise.all(S);const w=u.map(g=>this.base64ToBytes(g));return n.decode(this.concatBytes(w))}async ensureScriptPayload(e){if(e&&typeof e.content=="string"&&e.content.length>0)return e.resources==null&&e.resourceContents!=null&&(e.resources=e.resourceContents),e;if(!e||!e.id)throw new Error("Userscript descriptor missing id");if(this.scriptPayloadPromises.has(e.id))return await this.scriptPayloadPromises.
get(e.id);const t=(async()=>{const n={scriptId:e.id,payloadRevision:e.payloadRevision};n.url=window.location.href;const o=await this.fetchTextFromChunks("getUserScriptContentChunk",n),r=Array.isArray(e.resourceNames)?e.resourceNames:[],s={};for(const a of r)s[a]=await this.fetchTextFromChunks("getUserScriptResourceChunk",{...n,resourceName:a});return{...e,content:o,resources:s}})();this.scriptPayloadPromises.set(e.id,t);try{return await t}catch(n){throw this.scriptPayloadPromises.delete(e.id),n}}setupDocumentEventListeners(){
if(!this.documentEventsReady)if(this.documentEventsReady=!0,document.readyState!=="complete"){if(c("[wBlock] Waiting for document readiness."),document.addEventListener("DOMContentLoaded",()=>{c("[wBlock] DOMContentLoaded event fired, retrying pending scripts."),this.retryPendingScripts()}),window.addEventListener("load",()=>{c("[wBlock] Window load event fired, retrying pending scripts."),this.retryPendingScripts()}),!document.body&&typeof MutationObserver<"u"){const e=new MutationObserver(()=>{
document.body&&(e.disconnect(),c("[wBlock] document.body appeared, retrying pending scripts."),this.retryPendingScripts())});e.observe(document.documentElement||document,{childList:!0,subtree:!0})}}else c(`[wBlock] Document already ready (${document.readyState}), no need for event listeners.`)}async retryPendingScripts(){if(this.pendingScripts.length===0){c("[wBlock] No pending scripts to retry.");return}c(`[wBlock] Retrying ${this.pendingScripts.length} pending scripts...`);const e=[...this.pendingScripts];
this.pendingScripts=[];for(const t of e)await this.injectUserScript(t)}scriptMatchesCurrentURL(e){try{const t=new URL(window.location.href),n=t.hostname.toLowerCase();return Object.prototype.hasOwnProperty.call(e,"allowedHosts")&&(!Array.isArray(e.allowedHosts)||!e.allowedHosts.some(r=>{const s=String(r).trim().toLowerCase();return s&&(n===s||n.endsWith("."+s))}))||(Array.isArray(e.disabledHosts)?e.disabledHosts:[]).some(r=>{const s=String(r).trim().toLowerCase();return s&&(n===s||n.endsWith("."+
s))})?!1:(Array.isArray(e.matches)?e.matches:[]).some(r=>{const s=String(r).match(/^([^:]+):\/\/([^/]+)(\/.*)$/);if(!s)return!1;const a=s[1].toLowerCase();if(!(a==="*"?t.protocol==="http:"||t.protocol==="https:":t.protocol===a+":"))return!1;const d=s[2].toLowerCase();if(!(d==="*"||d===n||d.startsWith("*.")&&(n===d.slice(2)||n.endsWith("."+d.slice(2)))))return!1;const h=s[3].replace(/[.+?^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*");return new RegExp("^"+h+"$").test(t.pathname+t.search+t.hash)})}catch{
return!1}}isWarmStartEligible(e){if(!e||e.isEnabled!==!0||e.runAt!=="document-start"||e.noframes===!0&&window!==window.top)return!1;if(e.kind==="style")return this.isStyleWarmStartEligible(e);const t=e.isLocal===!1&&/^https:\/\//i.test(e.sourceURL||""),n=e.injectInto==="page"&&(t||e.isLocal===!0),o=t&&e.injectInto==="content"&&e.sourceURL===C&&typeof e.contentDigest=="string"&&/^[0-9a-f]{64}$/.test(e.contentDigest);if(!n&&!o||n&&A(e)||typeof e.content!="string"||!e.content||!this.scriptMatchesCurrentURL(
e)||(e.includes||[]).length||(e.excludes||[]).length||(e.excludeMatches||[]).length||(e.resourceNames||[]).length||(e.resourceURLs||[]).length||e.resources&&Object.keys(e.resources).length||Object.prototype.hasOwnProperty.call(e,"storageSnapshot")||e.storageBridgeId||e.menuBridgeId||e.xhrBridgeId||e.portBridgeId)return!1;const r=new Set(["none","unsafewindow","gm_info","gm.info"]);return(V(e)||o)&&(r.add("gm_xmlhttprequest"),r.add("gm.xmlhttprequest")),(Array.isArray(e.grant)?e.grant:[]).every(a=>r.
has(String(a).toLowerCase()))}isStyleWarmStartEligible(e){return!(typeof e.content!="string"||!e.content||typeof e.contentDigest!="string"||!/^[0-9a-f]{64}$/.test(e.contentDigest)||!this.scriptMatchesCurrentURL(e)||(e.includes||[]).length||(e.excludes||[]).length||(e.excludeMatches||[]).length)}loadWarmStartScripts(){try{const e=U();if(!e)return null;if(e.length*3>L&&new TextEncoder().encode(e).length>L){v();return}const t=JSON.parse(e),n=t&&Number.isFinite(t.savedAt)?Date.now()-t.savedAt:-1,o=t&&
t.version===1&&Array.isArray(t.scripts),r=o&&t.scripts.find(a=>a&&a.isEnabled===!0&&a.sourceURL===C&&this.scriptMatchesCurrentURL(a));if(r&&this.showDarkReaderGuard(r),!o||n<0||n>z){v();return}const s=t.scripts.filter(a=>this.isWarmStartEligible(a)).slice(0,P).map(a=>{const{storageBridgeId:u,menuBridgeId:d,xhrBridgeId:f,portBridgeId:h,storageSnapshot:B,__wblockWarmStart:S,...w}=a;return{...w,__wblockWarmStart:!0}});if(s.length){const a=this.prepareWarmStartValidations(s);return this.injectUserScripts(
s),a}}catch(e){p("[wBlock] Warm-start cache rejected:",e),v()}return null}showDarkReaderGuard(e){if(window!==window.top||!String(e.content).startsWith("const __wblockDarkReaderFollowsSystemAppearance = false;")&&!(typeof matchMedia=="function"&&matchMedia("(prefers-color-scheme: dark)").matches))return;const n=document.createElement("style");n.textContent="html { color-scheme: dark !important; } html, body, body :not(iframe) { background-color: #181a1b !important; border-color: #776e62 !importan\
t; color: #e8e6e3 !important; }",this.darkReaderGuard=n,this.waitForDocumentRoot().then(o=>{this.darkReaderGuard===n&&o.appendChild(n)}),setTimeout(()=>this.removeDarkReaderGuard(),3e3)}removeDarkReaderGuard(e){!this.darkReaderGuard||e&&e.sourceURL!==C||(this.darkReaderGuard.remove(),this.darkReaderGuard=null)}async warmStartContentDigest(e){if(typeof crypto>"u"||!crypto.subtle||typeof crypto.subtle.digest!="function")return null;const t=new TextEncoder().encode(e),n=new Uint8Array(await crypto.
subtle.digest("SHA-256",t));return Array.from(n,o=>o.toString(16).padStart(2,"0")).join("")}prepareWarmStartValidations(e){const t=[];for(const n of e){if(!this.isWarmStartEligible(n))continue;const o=this.scriptExecutionKey(n);let r;const s=new Promise(u=>{r=u}),a=(async()=>{try{if((n.injectInto==="content"||n.kind==="style")&&await this.warmStartContentDigest(n.content)!==n.contentDigest)return{ok:!1,error:"userscript-integrity-mismatch"};const u=this.requestScriptValidation(n);return r(),await u}finally{
r()}})();this.warmStartValidationPromises.set(o,a),t.push(s)}return t.length>0?Promise.all(t):null}persistWarmStartScripts(e){try{const t=Date.now(),n=JSON.stringify({version:1,savedAt:t,scripts:[]}).slice(0,-2),o=new TextEncoder,r=[];let s=o.encode(n).length+2;for(const f of e){if(r.length>=P)break;if(!this.isWarmStartEligible(f))continue;const{storageBridgeId:h,menuBridgeId:B,xhrBridgeId:S,portBridgeId:w,storageSnapshot:g,__wblockWarmStart:y,...X}=f,$=JSON.stringify(X),D=o.encode($).length+(r.
length>0?1:0);s+D<=L&&(r.push($),s+=D)}const a=U();if(r.length===0){a!==null&&v();return}const u=r.join(",")+"]}",d=a&&/^\{"version":1,"savedAt":(\d+),"scripts":\[/.exec(a);if(d&&t-d[1]>=0&&t-d[1]<60*1e3&&a.length===d[0].length+u.length&&a.endsWith(u))return;K(n+u)}catch{}}requestUserScripts(e=0,t=this.documentStartRequestGeneration){if(this.pageHidden||t!==this.documentStartRequestGeneration)return;const n=window.location.href;c(`[wBlock] Requesting userscripts for URL: ${n}`),this.sendNativeRequest(
"getUserScripts",{url:n,includeContent:!0,maxInlineContentBytes:512*1024}).then(o=>{if(t!==this.documentStartRequestGeneration)return;if(o&&o.error)throw new Error(o.error);const r=o&&o.userScripts?o.userScripts:[];this.persistWarmStartScripts(r),r.some(s=>s&&s.sourceURL===C)||this.removeDarkReaderGuard(),this.enableReturnYouTubeDislikePrefetch(r),r.length===0&&c("[wBlock] No userscripts found in getUserScripts response."),this.injectUserScripts(r,t)}).catch(o=>{this.retryUserScriptRequest(e,o,t)})}enableReturnYouTubeDislikePrefetch(e){
if(this.rydPrefetchEnabled||typeof fetch!="function"||!e.some(o=>o&&o.name==="Return YouTube Dislike"&&/^https:\/\/raw\.githubusercontent\.com\/Anarios\/return-youtube-dislike\//i.test(o.sourceURL||"")))return;this.rydPrefetchEnabled=!0;const n=()=>setTimeout(()=>this.prefetchReturnYouTubeDislike(),0);document.addEventListener("yt-navigate-start",n,!0),this.prefetchReturnYouTubeDislike()}prefetchReturnYouTubeDislike(){const e=new URL(window.location.href);if(!/(^|\.)youtube\.com$/i.test(e.hostname)||
e.hostname==="music.youtube.com")return;const t=e.pathname.startsWith("/shorts/")?e.pathname.split("/")[2]:e.searchParams.get("v");if(!/^[A-Za-z0-9_-]{11}$/.test(t||""))return;const n=`https://returnyoutubedislikeapi.com/votes?videoId=${encodeURIComponent(t)}`;fetch(n).then(o=>o.text()).catch(()=>{})}retryUserScriptRequest(e,t,n=this.documentStartRequestGeneration){const o=this.userScriptRequestRetryDelays[e];if(typeof o!="number"){_("[wBlock] Failed to request userscripts:",t);return}_(`[wBlock\
] Userscript request ${e+1} failed, retrying in ${o} ms:`,t),setTimeout(()=>{n===this.documentStartRequestGeneration&&this.requestUserScripts(e+1,n)},o)}setupMessageListener(){if(this.messageListenerAttached){c("[wBlock] Message listener already attached.");return}c("[wBlock] Setting up message listener."),typeof browser<"u"&&browser.runtime&&browser.runtime.onMessage?(c("[wBlock] Using browser.runtime.onMessage for listening."),F(browser.runtime.onMessage,(e,t,n)=>{if(c("[wBlock] Received messa\
ge via browser.runtime.onMessage:",e),e&&e.type==="wblock:pageSupportProbe")return Promise.resolve({ok:!0,host:typeof location<"u"?location.hostname:"",protocol:typeof location<"u"?location.protocol:""});if(e&&e.type==="wblock:clearDocumentStartSessionCache")return this.invalidateDocumentStartSessionCache(),Promise.resolve({ok:!0});if(e&&e.type==="wblock:menu:invokeCommand")return this.invokeMenuCommand(e.bridgeId,e.commandId);if(e&&e.type==="wblock:menu:syncState")return this.syncMenuCommandsToBackground(),
Promise.resolve({ok:!0});if(e&&e.type==="wblock:gm-port-message")return Promise.resolve({ok:!0});let o=null;e&&e.userScripts?o=e.userScripts:e&&e.payload&&e.payload.userScripts&&(o=e.payload.userScripts),o?(c("[wBlock] Extracted userscripts from message (browser.runtime.onMessage):",o),this.injectUserScripts(o)):c("[wBlock] No userscripts found in received message (browser.runtime.onMessage).")}),this.messageListenerAttached=!0,this.extensionContextAvailable=!0,c("[wBlock] browser.runtime.onMess\
age listener attached.")):typeof safari<"u"&&safari.extension&&typeof safari.self<"u"&&safari.self.addEventListener?(c("[wBlock] Using safari.self.addEventListener for listening."),safari.self.addEventListener("message",e=>{c("[wBlock] Received message via safari.self.addEventListener:",e.name,e.message);const t=e.message&&e.message.requestId;if(t&&this.pendingNativeRequests.has(t)){const o=this.pendingNativeRequests.get(t);this.pendingNativeRequests.delete(t),o&&o.timeoutId&&clearTimeout(o.timeoutId),
o.resolve(e.message);return}if(e.name==="wblock:clearDocumentStartSessionCache"){this.invalidateDocumentStartSessionCache();return}let n=null;(e.name==="getUserScripts"||e.name==="requestUserScripts")&&e.message&&e.message.userScripts?n=e.message.userScripts:e.name==="requestRules"&&e.message&&e.message.payload&&e.message.payload.userScripts&&(n=e.message.payload.userScripts),n?(c("[wBlock] Extracted userscripts from message (safari.self.addEventListener):",n),this.injectUserScripts(n)):c("[wBlo\
ck] No userscripts found in received message (safari.self.addEventListener).")},!1),this.messageListenerAttached=!0,this.extensionContextAvailable=!0,c("[wBlock] safari.self.addEventListener listener attached.")):this.extensionContextUnavailableLogged||(this.extensionContextUnavailableLogged=!0,p("[wBlock] Extension context is unavailable in this frame."))}injectUserScripts(e,t=this.documentStartRequestGeneration){if(this.pageHidden||t!==this.documentStartRequestGeneration)return;if(c("[wBlock] \
injectUserScripts called with:",e),!Array.isArray(e)){p("[wBlock] injectUserScripts called with non-array:",e);return}if(e.length===0){c("[wBlock] No userscripts to inject.");return}const n={"document-start":0,"document-body":1,"document-end":2,"document-idle":3},o=[...e].sort((s,a)=>{const u=n[s&&s.runAt]??2,d=n[a&&a.runAt]??2;return u-d});o.filter(s=>s&&s.id).forEach(s=>{this.ensureScriptPayload(s).then(a=>this.prefetchScriptValidation(a)).catch(a=>{p(`[wBlock] Failed to preload userscript pay\
load for ${s.name}:`,a)})}),(async()=>{for(const s of o){if(t!==this.documentStartRequestGeneration)return;await this.injectUserScript(s,t)}})().catch(s=>p("[wBlock] Ordered userscript injection failed:",s))}scriptExecutionKey(e){return e&&e.id?String(e.id):String(e&&e.name||"")}async injectUserScript(e,t=this.documentStartRequestGeneration){if(t!==this.documentStartRequestGeneration)return;if(!e||!e.name){p("[wBlock] Attempted to inject invalid script object:",e);return}c(`[wBlock] Processing u\
serscript: ${e.name}`);const n=this.scriptExecutionKey(e);if(this.injectedScripts.has(n)){c(`[wBlock] Userscript ${e.name} already injected. Skipping.`);return}const o=this.scriptInjections.get(n),r=(async()=>{await o,!(t!==this.documentStartRequestGeneration||this.injectedScripts.has(n))&&await this.injectSingleScriptAsync(e,t)})();this.scriptInjections.set(n,r.catch(()=>{})),await r}requestScriptValidation(e){return this.pendingValidations||(this.pendingValidations=[],queueMicrotask(async()=>{
const t=this.pendingValidations;this.pendingValidations=null;for(let n=0;n<t.length;n+=256){const o=t.slice(n,n+256);try{const r=await this.sendNativeRequest("validateUserScriptExecutions",{scripts:o.map(s=>s.request)});o.forEach((s,a)=>s.resolve(r?.results?.[a]||{ok:!1}))}catch(r){o.forEach(s=>s.reject(r))}}})),new Promise((t,n)=>this.pendingValidations.push({resolve:t,reject:n,request:{scriptId:e.id,payloadRevision:e.payloadRevision,...typeof e.contentDigest=="string"&&e.contentDigest.length>0?
{contentDigest:e.contentDigest}:{}}}))}prefetchScriptValidation(e){if(!e||!e.id||e.__wblockWarmStart===!0||!Number.isSafeInteger(e.payloadRevision)||e.payloadRevision<0)return;const t=this.scriptExecutionKey(e);if(this.injectedScripts.has(t))return;const n=window.location.href,o=this.validationPrefetches.get(t);if(o&&o.url===n&&o.payloadRevision===e.payloadRevision)return;const r=this.requestScriptValidation(e);r.catch(()=>{}),this.validationPrefetches.set(t,{url:n,payloadRevision:e.payloadRevision,
promise:r})}async validateScriptForExecution(e,t){if(!e||!e.id||!Number.isSafeInteger(e.payloadRevision)||e.payloadRevision<0)return!1;const n=this.scriptExecutionKey(e),o=e.__wblockWarmStart===!0?this.warmStartValidationPromises.get(n):null;let r;if(o)r=await o;else{const s=this.validationPrefetches.get(n);if(this.validationPrefetches.delete(n),s&&s.url===window.location.href&&s.payloadRevision===e.payloadRevision)try{r=await s.promise}catch{r=await this.requestScriptValidation(e)}else r=await this.
requestScriptValidation(e)}return!r||r.ok!==!0?(r&&r.error&&c(`[wBlock] Native execution validation rejected ${e.name}: ${r.error}`),r&&r.error==="userscript-state-changed"&&e.__wblockWarmStart!==!0&&t===this.documentStartRequestGeneration&&t!==this.stateChangeRetryGeneration&&(this.stateChangeRetryGeneration=t+1,this.invalidateDocumentStartSessionCache()),!1):!0}injectSingleScript(e,t=this.documentStartRequestGeneration){this.injectSingleScriptAsync(e,t).catch(n=>{_(`[wBlock] Failed to inject u\
serscript ${e&&e.name?e.name:"unknown"}:`,n)})}async injectSingleScriptAsync(e,t=this.documentStartRequestGeneration){if(t!==this.documentStartRequestGeneration)return;if(e.noframes&&window!==window.top){c(`[wBlock] Skipping ${e.name} in iframe due to @noframes directive`);return}if(e.kind==="style"){const r=this.scriptExecutionKey(e);if(this.injectedScripts.has(r)||this.injectingScripts.get(r)===t)return;this.injectingScripts.set(r,t);try{const s=await this.ensureScriptPayload(e);if(t!==this.documentStartRequestGeneration)
return;const a=typeof s.content=="string"?s.content:"";if(a.length>0){if(await this.waitForDocumentRoot(),t!==this.documentStartRequestGeneration)return;const u=await this.validateScriptForExecution(s,t);if(t!==this.documentStartRequestGeneration||!u)return;this.injectStyleElement(s,a),t===this.documentStartRequestGeneration&&this.injectedScripts.add(r)}}finally{this.injectingScripts.get(r)===t&&this.injectingScripts.delete(r)}return}if(!this.shouldRunScript(e)){this.pendingScripts.some(r=>r.name===
e.name)||(c(`[wBlock] Adding ${e.name} to pending scripts list.`),this.pendingScripts.push(e),this.setupDocumentEventListeners());return}const n=this.scriptExecutionKey(e);this.injectingScripts.set(n,t);const o=e.__wblockWarmStart===!0;o&&(delete e.storageBridgeId,delete e.menuBridgeId,delete e.xhrBridgeId,delete e.portBridgeId,delete e.storageSnapshot);try{if(e.runAt==="document-idle"&&typeof requestIdleCallback=="function"&&(await new Promise(u=>requestIdleCallback(u,{timeout:1e3})),t!==this.documentStartRequestGeneration))
return;const r=await this.ensureScriptPayload(e);if(t!==this.documentStartRequestGeneration)return;o&&(r.storageSnapshot={}),!o&&r.id&&!r.menuBridgeId&&(r.menuBridgeId=this.generateSecret("gmmenu")),!o&&!r.portBridgeId&&(r.portBridgeId=this.generateSecret("gmport"));const s=A(r)?"content":r.injectInto||"page";if(s!=="content"&&(delete r.storageBridgeId,delete r.xhrBridgeId,delete r.portBridgeId),c(`[wBlock] Injecting userscript: ${r.name} (mode: ${s})`),s!=="content"){if(await this.waitForDocumentRoot(),
t!==this.documentStartRequestGeneration)return;r.runAt==="document-start"&&!R()&&(r.wblockWaitForCspNonce||!this.inlinePageScriptsCanRun())&&await this.waitForCspNonce()}if(t!==this.documentStartRequestGeneration)return;const a=await this.validateScriptForExecution(r,t);if(t!==this.documentStartRequestGeneration||!a)return;this.scriptRuntimeReady||(this.scriptRuntimeReady=!0,this.setupMenuCommandBridge(),this.setupStorageBridge()),this.removeDarkReaderGuard(r),!o&&s!=="content"&&M(r)&&(this.tubeCleanerSettingsScript=
r),!o&&s!=="content"&&b(r)&&(this.popupBlockerScript=r,this.popupBlockerState=j(r.storageSnapshot)),s==="content"?this.injectInContentContext(r):s==="auto"?this.tryInjectInPageContext(r)||(c(`[wBlock] Page injection blocked (likely CSP), falling back to content context for ${r.name}`),this.injectInContentContext(r)):this.injectInPageContext(r),t===this.documentStartRequestGeneration&&(this.injectedScripts.add(n),c(`[wBlock] Successfully injected and registered userscript: ${r.name} at ${r.runAt||
"document-end"}`))}finally{this.injectingScripts.get(n)===t&&this.injectingScripts.delete(n)}}injectInPageContext(e){if(O()){c(`[wBlock] Skipping page-context injection in sandboxed frame (no allow-scripts): ${e.name}`);return}const t=document.createElement("script");t.textContent=this.wrapUserScript(e,"page"),t.setAttribute("data-userscript",e.name),t.setAttribute("type","text/javascript");const n=R();n&&(t.nonce=n),e.menuBridgeId&&this.attachPageMenuCommandBridge(t,e),(document.head||document.
documentElement).appendChild(t),t.remove(),c(`[wBlock] Injected ${e.name} in page context via <script> tag`)}tryInjectInPageContext(e){try{if(O())return!1;const t=document.createElement("script"),n=`__wblock_csp_test_${Date.now()}`;t.textContent=`try{document.documentElement && document.documentElement.setAttribute('${n}','1');}catch(e){}`;const o=R();o&&(t.nonce=o),(document.head||document.documentElement).appendChild(t);const r=document.documentElement&&document.documentElement.getAttribute(n)===
"1";t.remove();try{document.documentElement&&document.documentElement.removeAttribute(n)}catch{}return r?(this.injectInPageContext(e),!0):!1}catch(t){return c(`[wBlock] CSP test failed for ${e.name}: ${t.message}`),!1}}injectInContentContext(e){try{const t=this.wrapUserScript(e,"content");new Function("__wblockContext",t)(e),c(`[wBlock] Injected ${e.name} in content context (CSP-safe)`)}catch(t){_(`[wBlock] Content context execution failed for ${e.name}:`,t)}}injectStyleElement(e,t){const n=document.
createElement("style");return n.textContent=t,n.setAttribute("data-wblock-userstyle",e.name||""),(document.head||document.documentElement).appendChild(n),c(`[wBlock] Injected userstyle ${e.name} (${t.length} chars)`),n}shouldRunScript(e){const t=e.runAt||"document-end",n=document.readyState;let o=!1;switch(c(`[wBlock] Checking shouldRunScript for ${e.name}: runAt='${t}', document.readyState='${n}'`),t){case"document-start":o=!0;break;case"document-end":o=n==="interactive"||n==="complete";break;case"\
document-body":o=!!document.body;break;case"document-idle":o=n==="complete";break;default:p(`[wBlock] Unknown runAt value: '${t}' for script ${e.name}. Defaulting to document-end behavior.`),o=n==="interactive"||n==="complete";break}return c(o?`[wBlock] Userscript ${e.name} WILL run at this time (runAt: '${t}', readyState: '${n}').`:`[wBlock] Userscript ${e.name} will NOT run at this time (runAt: '${t}', readyState: '${n}').`),o}wrapUserScript(e,t="page"){const n=e.resources?JSON.stringify(e.resources):
"{}",o=t==="content",r=JSON.stringify(o?e.storageSnapshot||{}:Q(e)),s=!o&&b(e),a=o||s,u=s?"if (location.hostname === 'popupblocker.adguard.com' && location.pathname.endsWith('/options.html')) {":"",d=s?"}":"",f=(e.grant||[]).map(w=>String(w).toLowerCase()),h=!o||f.includes("unsafewindow")||f.every(w=>w==="none"),B=o?h?`// Content context: unsafeWindow is the content script's window (no page JS access)
    const unsafeWindow = window;`:"":`// Get reference to the actual page window (not the isolated extension context)
    // This is the real unsafeWindow that can access page variables
    const unsafeWindow = (function() {
        try {
            // Try to access the page's window through various methods
            if (typeof window.wrappedJSObject !== 'undefined') {
                return window.wrappedJSObject;
            }
            // In Safari, the window object we have IS the page context when injected via <script> tag
            return window;
        } catch (e) {
            wBlockWarn('[wBlock] Could not access page context, falling back to regular window');
            return window;
        }
    })();`,S=o?"'use strict';":"";return`
// wBlock Userscript Wrapper for: ${m(e.name)} (${t} context)
(function() {
    ${S}
    // Debug logging helpers - wrapper-private names avoid collisions with userscript globals.
    var __wBlockDebugLogging = ${I};
    var wBlockLog = (...args) => {
        if (__wBlockDebugLogging) {
            console.log(...args);
        }
    };

    var wBlockWarn = (...args) => {
        if (__wBlockDebugLogging) {
            console.warn(...args);
        }
    };

    var wBlockError = (...args) => {
        console.error(...args);
    };

    wBlockLog('[wBlock UserScript] Executing: ${m(e.name)} in ${t} context');

    // Store resources for this script
    const scriptResources = ${n};

    // Storage change listeners registry
    const storageListeners = new Map(); // key -> Map(listenerId, callback)
    const pendingStorageRequests = new Map(); // requestId -> { onFailure, timeoutId }
    const menuCommandCallbacks = new Map(); // commandId -> callback
    let listenerIdCounter = 0;
    const storageBridgeId = ${o?"__wblockContext.storageBridgeId || ''":"''"};
    const menuBridgeId = ${o?"__wblockContext.menuBridgeId || ''":"document.currentScript?.getAttribute('data-wblock-menu-bridge') || ''"};
    const xhrBridgeId = ${o?"__wblockContext.xhrBridgeId || ''":"''"};
    const portBridgeId = ${o?"__wblockContext.portBridgeId || ''":"''"};
    const pageMenuBridgeElement = ${o?"null":"document.currentScript"};
    const contentMenuBridge = ${o?"window.__wBlockMenuCommandBridge":"null"};
    const scriptStorageState = Object.assign({}, ${r});
    const runtimePorts = new Map(); // portName -> Set(port)

    const makeRuntimeEvent = () => {
        const listeners = new Set();
        return {
            addListener: function(listener) {
                if (typeof listener === 'function') listeners.add(listener);
            },
            removeListener: function(listener) {
                listeners.delete(listener);
            },
            hasListener: function(listener) {
                return listeners.has(listener);
            },
            dispatch: function(...args) {
                listeners.forEach(listener => {
                    try { listener(...args); }
                    catch (error) { wBlockError('[wBlock] Runtime port listener error:', error); }
                });
            }
        };
    };

    // Map a userscript-facing port name to the per-script wire channel name.
    // The background treats this string opaquely and echoes it back when
    // delivering port messages, so a page script that does not know
    // portBridgeId cannot address (or spoof messages to) this script's ports.
    const channelNameForPort = (userPortName) => {
        return portBridgeId && userPortName ? portBridgeId + '::' + userPortName : userPortName;
    };

    const createRuntimePort = (connectInfo) => {
        // Quarantined warm starts have no runtime/native port token at all.
        if (!portBridgeId) {
            return {
                name: typeof connectInfo === 'string' ? connectInfo : (connectInfo && connectInfo.name) || '',
                onMessage: makeRuntimeEvent(), onDisconnect: makeRuntimeEvent(),
                postMessage: function() {}, disconnect: function() {}
            };
        }
        const userPortName = typeof connectInfo === 'string'
            ? connectInfo
            : (connectInfo && typeof connectInfo.name === 'string' ? connectInfo.name : '');
        const channelName = channelNameForPort(userPortName);
        const onMessage = makeRuntimeEvent();
        const onDisconnect = makeRuntimeEvent();
        const port = {
            name: userPortName,
            onMessage: onMessage,
            onDisconnect: onDisconnect,
            postMessage: function(message) {
                // These streaming ports are receive-only; page events are never a transport.
            },
            disconnect: function() {
                const ports = runtimePorts.get(channelName);
                if (ports) {
                    ports.delete(port);
                    if (ports.size === 0) runtimePorts.delete(channelName);
                }
                onDisconnect.dispatch(port);
            }
        };
        if (!runtimePorts.has(channelName)) runtimePorts.set(channelName, new Set());
        runtimePorts.get(channelName).add(port);
        return port;
    };

    const deliverRuntimePortMessage = (portName, message) => {
        const ports = runtimePorts.get(portName);
        if (!ports || ports.size === 0) return false;
        ports.forEach(port => port.onMessage.dispatch(message, port));
        return true;
    };

    ${o?`
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
        const onPortMessage = (data) => {
            if (!data || data.type !== 'wblock:gm-port-message') return;
            deliverRuntimePortMessage(data.portName || '', data.message);
        };
        browser.runtime.onMessage.addListener(onPortMessage);
        window.addEventListener('pagehide', () => browser.runtime.onMessage.removeListener(onPortMessage));
        window.addEventListener('pageshow', (e) => { if (e.persisted) browser.runtime.onMessage.addListener(onPortMessage); });
    }
    `:""}

    const resolveUserscriptRequestURL = (url) => {
        try {
            return new URL(String(url || ''), location.href).href;
        } catch (_error) {
            return url;
        }
    };

    const patchRuntimeConnect = (api) => {
        if (!api || typeof api !== 'object') return api;
        if (!api.runtime || typeof api.runtime !== 'object') api.runtime = {};
        if (typeof api.runtime.connect !== 'function') {
            api.runtime.connect = function(connectInfo) { return createRuntimePort(connectInfo); };
        }
        return api;
    };

    try {
        let immersiveBrowserAPI = patchRuntimeConnect(globalThis.immersiveTranslateBrowserAPI);
        Object.defineProperty(globalThis, 'immersiveTranslateBrowserAPI', {
            configurable: true,
            get: function() { return immersiveBrowserAPI; },
            set: function(value) { immersiveBrowserAPI = patchRuntimeConnect(value); }
        });
    } catch (error) {
        wBlockWarn('[wBlock] Failed to install runtime port shim:', error);
    }

    const parseStoredValue = (rawValue) => {
        if (rawValue === null || typeof rawValue === 'undefined') {
            return undefined;
        }
        try {
            return JSON.parse(rawValue);
        } catch (error) {
            wBlockWarn('[wBlock] Failed to parse stored GM value, returning raw string:', error);
            return rawValue;
        }
    };

    const serializeStoredValue = (value) => {
        const serialized = JSON.stringify(value);
        return typeof serialized === 'undefined' ? 'undefined' : serialized;
    };

    const notifyStorageListeners = (key, oldValue, newValue, remote) => {
        const listeners = storageListeners.get(key);
        if (!listeners || listeners.size === 0) {
            return;
        }

        listeners.forEach((callback) => {
            try {
                callback(key, oldValue, newValue, remote);
            } catch (error) {
                wBlockError('[wBlock] Storage listener error:', error);
            }
        });
    };

    const postMenuCommandResult = (requestId, success, error) => {
        if (!pageMenuBridgeElement || typeof requestId !== 'string' || requestId.length === 0) return;
        pageMenuBridgeElement.dispatchEvent(new CustomEvent('wblock-gm-menu-invoke-result', {
            detail: {
                bridgeId: menuBridgeId,
                requestId: requestId,
                success: success !== false,
                error: typeof error === 'string' ? error : ''
            }
        }));
    };

    const normalizeMenuCommandOptions = (accessKey) => {
        if (typeof accessKey === 'string') {
            return { accessKey: accessKey, title: '' };
        }
        if (accessKey && typeof accessKey === 'object') {
            return {
                accessKey: typeof accessKey.accessKey === 'string' ? accessKey.accessKey : '',
                title: typeof accessKey.title === 'string' ? accessKey.title : ''
            };
        }
        return { accessKey: '', title: '' };
    };

    const publishMenuCommand = (kind, commandId, details, callback) => {
        if (!menuBridgeId || typeof commandId !== 'string' || commandId.length === 0) {
            return;
        }

        const normalizedDetails = {
            caption: typeof details.caption === 'string' ? details.caption : String(details.caption ?? ''),
            title: typeof details.title === 'string' ? details.title : '',
            accessKey: typeof details.accessKey === 'string' ? details.accessKey : '',
            scriptName: '${m(e.name||"Unknown Script")}'
        };

        if (contentMenuBridge && kind === 'register' && typeof contentMenuBridge.registerMenuCommand === 'function') {
            contentMenuBridge.registerMenuCommand(menuBridgeId, commandId, normalizedDetails, callback);
            return;
        }

        if (contentMenuBridge && kind === 'unregister' && typeof contentMenuBridge.unregisterMenuCommand === 'function') {
            contentMenuBridge.unregisterMenuCommand(menuBridgeId, commandId);
            return;
        }

        if (!pageMenuBridgeElement) {
            return;
        }

        pageMenuBridgeElement.dispatchEvent(new CustomEvent(
            kind === 'register' ? 'wblock-gm-menu-register' : 'wblock-gm-menu-unregister',
            {
                detail: kind === 'register'
                    ? { bridgeId: menuBridgeId, commandId: commandId, ...normalizedDetails }
                    : { bridgeId: menuBridgeId, commandId: commandId }
            }
        ));
    };

    ${o?"":`
    if (pageMenuBridgeElement) {
        pageMenuBridgeElement.addEventListener('wblock-gm-menu-invoke', (event) => {
            const detail = event && event.detail ? event.detail : {};
            if (detail.bridgeId !== menuBridgeId || typeof detail.commandId !== 'string') return;

            const callback = menuCommandCallbacks.get(detail.commandId);
            if (!callback) {
                postMenuCommandResult(detail.requestId, false, 'Menu command not found');
                return;
            }

            try {
                Promise.resolve(callback())
                    .then(() => postMenuCommandResult(detail.requestId, true, ''))
                    .catch((error) => {
                        postMenuCommandResult(
                            detail.requestId,
                            false,
                            error && error.message ? error.message : String(error)
                        );
                    });
            } catch (error) {
                postMenuCommandResult(
                    detail.requestId,
                    false,
                    error && error.message ? error.message : String(error)
                );
            }
        });
    }
    `}

    ${o?"":`
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        const data = event.data;
        if (!data || data.type !== 'wblock-gm-storage-result' || typeof data.requestId !== 'string') return;

        const pending = pendingStorageRequests.get(data.requestId);
        if (!pending) return;
        pendingStorageRequests.delete(data.requestId);
        clearTimeout(pending.timeoutId);

        if (data.success === false && typeof pending.onFailure === 'function') {
            pending.onFailure(data.error || 'Failed to persist GM storage change');
        }
    });
    `}

    const persistStorageChange = (kind, key, rawValue, onFailure) => {
        if (!key) {
            if (typeof onFailure === 'function') {
                onFailure('Missing GM storage key');
            }
            return;
        }

        ${o?`
        const message = {
            action: kind === 'set' ? 'setUserScriptStorageValue' : 'deleteUserScriptStorageValue',
            scriptId: '${m(e.id||"")}',
            key: key
        };
        if (kind === 'set') {
            message.rawValue = rawValue;
        }

        if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
            browser.runtime.sendMessage(message)
                .then((result) => {
                    if ((!result || result.ok === false) && typeof onFailure === 'function') {
                        onFailure((result && result.error) || 'Failed to persist GM storage change');
                    }
                })
                .catch((error) => {
                    if (typeof onFailure === 'function') {
                        onFailure(error && error.message ? error.message : String(error));
                    }
                });
            return;
        }

        if (typeof onFailure === 'function') {
            onFailure('No messaging API available for GM storage persistence');
        }
        `:`
        ${M(e)?`
        if (kind === 'set' && key === 'wblock.tubeCleaner.sponsorBlock') {
            try { window.postMessage({ type: 'wblock:tube-preferences', settings: JSON.parse(rawValue) }, '*'); }
            catch (_) { /* Invalid preference updates have no native effect. */ }
            return;
        }
        if (kind === 'set' && key === 'wblock.tubeCleaner.quality') {
            try { window.postMessage({ type: 'wblock:tube-preferences', quality: JSON.parse(rawValue) }, '*'); }
            catch (_) { /* Invalid preference updates have no native effect. */ }
            return;
        }
        `:""}
        ${b(e)?`
        // The content world decides what persists; deletes only run in migrations.
        if (kind === 'set') window.postMessage({ type: 'wblock:popup-blocker-storage', key, rawValue }, '*');
        return;
        `:""}
        if (!storageBridgeId) {
            if (typeof onFailure === 'function') {
                onFailure('Missing GM storage bridge identifier');
            }
            return;
        }

        const requestId = 'gmstorage-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        if (typeof onFailure === 'function') {
            const timeoutId = setTimeout(() => {
                const pending = pendingStorageRequests.get(requestId);
                if (!pending) return;
                pendingStorageRequests.delete(requestId);
                pending.onFailure('GM storage persistence timed out');
            }, 15000);
            pendingStorageRequests.set(requestId, { onFailure, timeoutId });
        }

        const message = {
            type: kind === 'set' ? 'wblock-gm-storage-set' : 'wblock-gm-storage-delete',
            bridgeId: storageBridgeId,
            key: key,
            requestId: requestId
        };
        if (kind === 'set') {
            message.rawValue = rawValue;
        }
        window.postMessage(message, '*');
        `}
    };

    const inferResourceMimeType = (resourceName, resourceValue) => {
        const lowerName = String(resourceName || '').toLowerCase();
        if (lowerName.endsWith('.css')) return 'text/css';
        if (lowerName.endsWith('.js') || lowerName.endsWith('.mjs')) return 'text/javascript';
        if (lowerName.endsWith('.json')) return 'application/json';
        if (lowerName.endsWith('.xml')) return 'application/xml';
        if (lowerName.endsWith('.svg')) return 'image/svg+xml';
        if (lowerName.endsWith('.png')) return 'image/png';
        if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
        if (lowerName.endsWith('.gif')) return 'image/gif';
        if (lowerName.endsWith('.webp')) return 'image/webp';
        if (lowerName.endsWith('.mp3')) return 'audio/mpeg';
        if (lowerName.endsWith('.ogg')) return 'audio/ogg';
        if (lowerName.endsWith('.wav')) return 'audio/wav';
        if (lowerName.endsWith('.woff2')) return 'font/woff2';
        if (lowerName.endsWith('.woff')) return 'font/woff';
        if (lowerName.endsWith('.ttf')) return 'font/ttf';

        const trimmedValue = typeof resourceValue === 'string' ? resourceValue.trim() : '';
        if (!trimmedValue) return 'text/plain';
        if (
            (trimmedValue.startsWith('{') && trimmedValue.endsWith('}'))
            || (trimmedValue.startsWith('[') && trimmedValue.endsWith(']'))
        ) {
            return 'application/json';
        }
        if (trimmedValue.startsWith('<svg')) {
            return 'image/svg+xml';
        }
        if (/(^|\\n)s*(?:const|let|var|function|class|export|import)\b/.test(trimmedValue) || trimmedValue.includes('=>')) {
            return 'text/javascript';
        }
        if (/(^|\\n)s*[@.#a-zA-Z0-9_-]+s*{/.test(trimmedValue) || /:s*[^;]+;/.test(trimmedValue)) {
            return 'text/css';
        }
        return 'text/plain';
    };

    const isProbablyTextMimeType = (mimeType) => {
        const normalized = String(mimeType || '').toLowerCase();
        return normalized.startsWith('text/')
            || normalized.includes('json')
            || normalized.includes('javascript')
            || normalized.includes('xml')
            || normalized === 'image/svg+xml';
    };

    const decodeDataUrlText = (dataUrl) => {
        const match = String(dataUrl || '').match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,([sS]*)$/i);
        if (!match) {
            return undefined;
        }

        const mimeType = match[1] || 'text/plain';
        if (!isProbablyTextMimeType(mimeType)) {
            return undefined;
        }

        try {
            if (match[2]) {
                const binary = atob(match[3] || '');
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                return new TextDecoder('utf-8').decode(bytes);
            }
            return decodeURIComponent(match[3] || '');
        } catch (error) {
            wBlockWarn('[wBlock] Failed to decode data URL resource text:', error);
            return undefined;
        }
    };

    const resolveResourceValue = (resourceName) => {
        if (!scriptResources || !Object.prototype.hasOwnProperty.call(scriptResources, resourceName)) {
            return undefined;
        }
        return scriptResources[resourceName];
    };

    const makeResourceURL = (resourceName) => {
        const resourceValue = resolveResourceValue(resourceName);
        if (typeof resourceValue !== 'string' || resourceValue.length === 0) {
            return undefined;
        }

        if (/^(data:|blob:|https?:)/i.test(resourceValue)) {
            return resourceValue;
        }

        const mimeType = inferResourceMimeType(resourceName, resourceValue);
        return 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(resourceValue);
    };

    ${B}

    const GM = {
        info: {
            script: {
                name: '${m(e.name||"Unknown Script")}',
                version: '${m(e.version||"1.0.0")}',
                description: '${m(e.description||"")}',
                namespace: '${m(e.namespace||"wblock")}',
                updateURL: '${m(e.updateURL||"")}',
                downloadURL: '${m(e.downloadURL||"")}'
            },
            scriptUpdateURL: '${m(e.updateURL||"")}',
            scriptDownloadURL: '${m(e.downloadURL||"")}',
            scriptHandler: 'wBlock Injector',
            version: '0.2.0'
        },
        log: function(...args) { wBlockLog('[UserScript:${m(e.name)}]', ...args); },

        // Greasemonkey API implementations backed by shared per-userscript storage
        getValue: function(key, defaultValue) {
            try {
                if (Object.prototype.hasOwnProperty.call(scriptStorageState, key)) {
                    return parseStoredValue(scriptStorageState[key]);
                }
                return defaultValue;
            } catch (e) {
                wBlockWarn('[wBlock] Failed to get value for key:', key, e);
                return defaultValue;
            }
        },

        setValue: function(key, value) {
            try {
                const hadValue = Object.prototype.hasOwnProperty.call(scriptStorageState, key);
                const previousRawValue = hadValue ? scriptStorageState[key] : undefined;
                const oldValue = hadValue ? parseStoredValue(previousRawValue) : undefined;
                const rawValue = serializeStoredValue(value);
                scriptStorageState[key] = rawValue;
                notifyStorageListeners(key, oldValue, value, false);
                persistStorageChange('set', key, rawValue, (error) => {
                    if (hadValue) {
                        scriptStorageState[key] = previousRawValue;
                    } else {
                        delete scriptStorageState[key];
                    }
                    wBlockWarn('[wBlock] Failed to persist value for key:', key, error);
                    notifyStorageListeners(key, value, oldValue, true);
                });
            } catch (e) {
                wBlockWarn('[wBlock] Failed to save value for key:', key, e);
            }
        },

        deleteValue: function(key) {
            try {
                if (!Object.prototype.hasOwnProperty.call(scriptStorageState, key)) {
                    return;
                }
                const previousRawValue = scriptStorageState[key];
                const oldValue = parseStoredValue(previousRawValue);
                delete scriptStorageState[key];
                notifyStorageListeners(key, oldValue, undefined, false);
                persistStorageChange('delete', key, undefined, (error) => {
                    scriptStorageState[key] = previousRawValue;
                    wBlockWarn('[wBlock] Failed to delete value for key:', key, error);
                    notifyStorageListeners(key, undefined, oldValue, true);
                });
            } catch (e) {
                wBlockWarn('[wBlock] Failed to delete value for key:', key, e);
            }
        },

        listValues: function() {
            try {
                return Object.keys(scriptStorageState);
            } catch (e) {
                wBlockWarn('[wBlock] Failed to list values:', e);
                return [];
            }
        },

        getResourceURL: function(resourceName) {
            const resolvedURL = makeResourceURL(resourceName);
            if (resolvedURL) {
                return resolvedURL;
            }
            wBlockWarn('[wBlock] Resource URL not found:', resourceName);
            return undefined;
        },

        getResourceUrl: function(resourceName) {
            return GM.getResourceURL(resourceName);
        },

        getResourceText: function(resourceName) {
            wBlockLog('[wBlock] GM_getResourceText called with:', resourceName);
            const resourceValue = resolveResourceValue(resourceName);
            if (typeof resourceValue === 'string') {
                if (/^data:/i.test(resourceValue)) {
                    return decodeDataUrlText(resourceValue);
                }
                return resourceValue;
            }
            wBlockWarn('[wBlock] Resource not found:', resourceName);
            return undefined;
        },

        addElement: function(parentOrTagName, tagNameOrAttributes, maybeAttributes) {
            try {
                let parent = null;
                let tagName = parentOrTagName;
                let attributes = tagNameOrAttributes;

                if (parentOrTagName && typeof parentOrTagName.appendChild === 'function') {
                    parent = parentOrTagName;
                    tagName = tagNameOrAttributes;
                    attributes = maybeAttributes;
                }

                wBlockLog('[wBlock] GM_addElement called:', tagName, attributes);
                const element = document.createElement(tagName);

                if (attributes) {
                    for (const [key, value] of Object.entries(attributes)) {
                        if (key === 'textContent') {
                            element.textContent = value;
                        } else if (key === 'innerHTML') {
                            element.innerHTML = value;
                        } else if (key === 'parentNode') {
                            continue;
                        } else {
                            element.setAttribute(key, value);
                        }
                    }
                }

                parent = parent || (attributes && attributes.parentNode ? attributes.parentNode : (document.head || document.documentElement));
                if (parent) {
                    parent.appendChild(element);
                }

                return element;
            } catch (e) {
                wBlockError('[wBlock] GM_addElement failed:', e);
                return null;
            }
        },

        addValueChangeListener: function(key, callback) {
            const listenerId = ++listenerIdCounter;
            wBlockLog('[wBlock] GM.addValueChangeListener:', key, listenerId);

            if (!storageListeners.has(key)) {
                storageListeners.set(key, new Map());
            }
            storageListeners.get(key).set(listenerId, callback);

            return listenerId;
        },

        removeValueChangeListener: function(listenerId) {
            wBlockLog('[wBlock] GM.removeValueChangeListener:', listenerId);

            for (const [key, listeners] of storageListeners.entries()) {
                if (listeners.has(listenerId)) {
                    listeners.delete(listenerId);
                    if (listeners.size === 0) {
                        storageListeners.delete(key);
                    }
                    return;
                }
            }
        },

        registerMenuCommand: function(caption, callback, accessKey) {
            wBlockLog('[wBlock] GM.registerMenuCommand called:', caption);
            if (typeof callback !== 'function') {
                wBlockWarn('[wBlock] Ignoring GM.registerMenuCommand with non-function callback:', caption);
                return null;
            }

            const menuCommandId = 'menu-' + (++listenerIdCounter);
            const normalizedCaption = typeof caption === 'string' ? caption : String(caption ?? '');
            const options = normalizeMenuCommandOptions(accessKey);
            menuCommandCallbacks.set(menuCommandId, callback);
            publishMenuCommand('register', menuCommandId, {
                caption: normalizedCaption,
                title: options.title,
                accessKey: options.accessKey
            }, callback);
            return menuCommandId;
        },

        unregisterMenuCommand: function(menuCommandId) {
            wBlockLog('[wBlock] GM.unregisterMenuCommand called:', menuCommandId);
            if (!menuCommandCallbacks.has(menuCommandId)) {
                return;
            }
            menuCommandCallbacks.delete(menuCommandId);
            publishMenuCommand('unregister', menuCommandId, {}, null);
        },

        addStyle: function(css) {
            try {
                const style = document.createElement('style');
                style.textContent = css;
                (document.head || document.documentElement).appendChild(style);
                return style;
            } catch (e) {
                wBlockError('[wBlock] GM.addStyle failed:', e);
                return null;
            }
        },

        setClipboard: function(data, info, callback) {
            const text = typeof data === 'string' ? data : String(data ?? '');
            const finish = () => {
                if (typeof callback === 'function') {
                    callback();
                }
            };

            const fallbackCopy = () => {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', 'readonly');
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                (document.body || document.documentElement).appendChild(textarea);
                if (typeof textarea.select === 'function') {
                    textarea.select();
                }
                if (typeof textarea.setSelectionRange === 'function') {
                    textarea.setSelectionRange(0, text.length);
                }
                if (typeof document.execCommand === 'function') {
                    document.execCommand('copy');
                }
                textarea.remove();
                finish();
            };

            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                return navigator.clipboard.writeText(text)
                    .then(() => finish())
                    .catch((error) => {
                        wBlockWarn('[wBlock] navigator.clipboard.writeText failed, falling back:', error);
                        fallbackCopy();
                    });
            }

            fallbackCopy();
            return Promise.resolve();
        },

        openInTab: function(url, options) {
            const openInBackground = options && options.active === false;
            const newWindow = window.open(url, '_blank');
            if (!openInBackground && newWindow) {
                newWindow.focus();
            }
            return newWindow;
        },

        notification: function(options) {
            wBlockLog('[wBlock] GM_notification called with:', options);
            // Basic notification implementation
            if (typeof options === 'string') {
                wBlockLog('[wBlock] Notification:', options);
            } else if (options && options.text) {
                wBlockLog('[wBlock] Notification:', options.text);
            }
        },

        download: function(details, name) {
            const normalized = typeof details === 'string'
                ? { url: details, name: name }
                : (details || {});
            const downloadURL = normalized.url || normalized.href;
            const fileName = normalized.name || normalized.filename || name || '';

            if (!downloadURL) {
                const error = new Error('GM_download requires a URL');
                if (typeof normalized.onerror === 'function') {
                    normalized.onerror(error);
                }
                throw error;
            }

            const clickDownloadLink = (href, revokeURL) => {
                const link = document.createElement('a');
                link.href = href;
                if (fileName) {
                    link.download = fileName;
                }
                link.rel = 'noopener';
                link.style.display = 'none';
                (document.body || document.documentElement).appendChild(link);
                if (typeof link.click === 'function') {
                    link.click();
                }
                link.remove();
                if (revokeURL && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
                    setTimeout(() => URL.revokeObjectURL(href), 60000);
                }
            };

            if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
                clickDownloadLink(downloadURL, false);
                if (typeof normalized.onload === 'function') {
                    setTimeout(() => normalized.onload(), 0);
                }
                return {
                    abort: function() {
                        wBlockLog('[wBlock] GM_download abort requested for:', downloadURL);
                    }
                };
            }

            const request = __wBlockLegacyGM.xmlhttpRequest({
                method: normalized.method || 'GET',
                url: downloadURL,
                headers: normalized.headers || {},
                data: normalized.data,
                anonymous: normalized.anonymous === true,
                timeout: normalized.timeout || 0,
                responseType: 'blob',
                onloadstart: function(response) {
                    if (typeof normalized.onloadstart === 'function') normalized.onloadstart(response);
                },
                onprogress: function(response) {
                    if (typeof normalized.onprogress === 'function') normalized.onprogress(response);
                },
                onload: function(response) {
                    try {
                        const responseBody = response && response.response;
                        const blob = typeof Blob !== 'undefined' && responseBody instanceof Blob
                            ? responseBody
                            : new Blob([responseBody || response.responseText || '']);
                        const objectURL = URL.createObjectURL(blob);
                        clickDownloadLink(objectURL, true);
                        if (typeof normalized.onload === 'function') {
                            normalized.onload(response);
                        }
                    } catch (error) {
                        if (typeof normalized.onerror === 'function') {
                            normalized.onerror(error);
                        } else {
                            wBlockError('[wBlock] GM_download failed:', error);
                        }
                    }
                },
                onerror: function(response) {
                    if (typeof normalized.onerror === 'function') normalized.onerror(response);
                },
                ontimeout: function(response) {
                    if (typeof normalized.ontimeout === 'function') normalized.ontimeout(response);
                    else if (typeof normalized.onerror === 'function') normalized.onerror(response);
                },
                onabort: function(response) {
                    if (typeof normalized.onabort === 'function') normalized.onabort(response);
                }
            });

            return {
                abort: function() {
                    wBlockLog('[wBlock] GM_download abort requested for:', downloadURL);
                    if (request && typeof request.abort === 'function') {
                        request.abort();
                    }
                }
            };
        },

        xmlhttpRequest: function(details) {
            // GM_xmlhttpRequest routed through the extension's background/native
            // layer to bypass page-level CORS restrictions.
            wBlockLog('[wBlock] GM_xmlhttpRequest called with:', details);

            if (!details || !details.url) {
                wBlockError('[wBlock] GM_xmlhttpRequest: No URL provided');
                return;
            }

            const method = (details.method || 'GET').toUpperCase();
            const requestId = 'gmxhr-' + Date.now() + '-' + Math.random().toString(36).slice(2);

            const normalizeGMResponseHeaders = (headers) => {
                if (typeof headers === 'string') return headers;
                if (!headers || typeof headers !== 'object') return '';
                return Object.entries(headers)
                    .map(([key, value]) => key + ': ' + value)
                    .join('\\r\\n');
            };

            let completed = false;
            let timeoutId = null;

            const clearRequestTimeout = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
            };

            const normalizeGMResponseType = (responseType) => String(responseType || 'text').trim().toLowerCase();

            const arrayBufferFromBase64 = (base64) => {
                const binary = atob(base64 || '');
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                return bytes.buffer;
            };

            const makeTypedResponseBody = (result) => {
                const responseType = normalizeGMResponseType(details.responseType);
                if (!result || typeof result.responseBase64 !== 'string') {
                    return result ? result.response : undefined;
                }

                const arrayBuffer = arrayBufferFromBase64(result.responseBase64);
                if (responseType === 'arraybuffer') {
                    return arrayBuffer;
                }
                if (responseType === 'blob') {
                    const mimeType = typeof result.responseMimeType === 'string' ? result.responseMimeType : '';
                    return typeof Blob !== 'undefined' ? new Blob([arrayBuffer], { type: mimeType }) : arrayBuffer;
                }
                return result.response;
            };

            const makeResponse = (result) => {
                const loaded = Number(result.responseLength || 0);
                const total = Number(result.responseTotal || loaded || 0);
                return {
                    status: result.status,
                    statusText: result.statusText,
                    responseHeaders: normalizeGMResponseHeaders(result.responseHeaders),
                    responseText: typeof result.responseText === 'string' ? result.responseText : '',
                    response: makeTypedResponseBody(result),
                    readyState: 4,
                    loaded: loaded,
                    total: total,
                    lengthComputable: total > 0,
                    finalUrl: result.finalUrl || details.url,
                    responseURL: result.finalUrl || details.url
                };
            };

            const dispatchReadyState = (readyState) => {
                if (typeof details.onreadystatechange === 'function') {
                    details.onreadystatechange({ readyState: readyState, status: 0, statusText: '', finalUrl: details.url, responseURL: details.url });
                }
            };

            const dispatchLoadStart = () => {
                if (typeof details.onloadstart === 'function') {
                    details.onloadstart({ readyState: 1, loaded: 0, total: 0, lengthComputable: false });
                }
                dispatchReadyState(1);
            };

            const onResult = (result) => {
                if (completed) return;
                completed = true;
                clearRequestTimeout();
                const response = makeResponse(result);
                if (typeof details.onprogress === 'function') {
                    details.onprogress(response);
                }
                if (typeof details.onreadystatechange === 'function') {
                    details.onreadystatechange(response);
                }
                if (typeof details.onload === 'function') {
                    details.onload(response);
                }
                if (typeof details.onloadend === 'function') {
                    details.onloadend(response);
                }
            };
            const onFail = (errorMsg, callbackName = 'onerror') => {
                if (completed) return;
                completed = true;
                clearRequestTimeout();
                wBlockError('[wBlock] GM_xmlhttpRequest error:', errorMsg);
                const response = { error: errorMsg, statusText: errorMsg, readyState: 4 };
                if (typeof details[callbackName] === 'function') {
                    details[callbackName](response);
                } else if (callbackName !== 'onerror' && typeof details.onerror === 'function') {
                    details.onerror(response);
                }
                if (typeof details.onloadend === 'function') {
                    details.onloadend(response);
                }
            };

            const requestPayload = {
                scriptId: '${m(e.id||"")}',
                url: resolveUserscriptRequestURL(details.url),
                method: method,
                headers: details.headers || {},
                body: details.data || null,
                anonymous: !!details.anonymous,
                responseType: details.responseType || 'text',
                redirect: details.redirect || 'follow',
                timeout: details.timeout || 0,
                overrideMimeType: details.overrideMimeType || '',
                portName: channelNameForPort(details.portName || (details.extra && details.extra.portName) || '')
            };

            const timeoutMs = Number(details.timeout || 0);
            if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
                timeoutId = setTimeout(() => {
                    onFail('GM_xmlhttpRequest timed out', 'ontimeout');
                }, timeoutMs);
            }

            dispatchLoadStart();

            ${o?`
            // Content context: send directly via browser.runtime.sendMessage
            (async () => {
                try {
                    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
                        const result = await browser.runtime.sendMessage({
                            action: 'gmXmlhttpRequest', ...requestPayload
                        });
                        if (result && result.error) { onFail(result.error); }
                        else { onResult(result); }
                        return;
                    }
                    onFail('No messaging API available');
                } catch (error) {
                    onFail(error.message || String(error));
                }
            })();

            return { abort: function() { wBlockLog('[wBlock] GM_xmlhttpRequest abort called'); onFail('GM_xmlhttpRequest aborted', 'onabort'); } };
            `:`
            // MAIN has ordinary page network authority only. CSP and CORS still
            // apply, and no extension credentials, ports or native headers exist.
            const pageAbort = typeof AbortController === 'function' ? new AbortController() : null;
            Promise.resolve().then(() => fetch(requestPayload.url, {
                method, headers: requestPayload.headers, body: requestPayload.body,
                mode: 'cors', credentials: requestPayload.anonymous ? 'omit' : 'same-origin',
                redirect: requestPayload.redirect, signal: pageAbort ? pageAbort.signal : undefined
            })).then(async response => onResult({
                status: response.status, statusText: response.statusText,
                responseText: await response.text(), finalUrl: response.url,
                responseHeaders: Array.from(response.headers.entries()).map(pair => pair.join(': ')).join('\\r\\n')
            })).catch(error => onFail(error.message || String(error)));
            return { abort: function() { if (pageAbort) pageAbort.abort(); onFail('GM_xmlhttpRequest aborted', 'onabort'); } };
            `}
        },

        xmlHttpRequest: function(details) {
            return GM.xmlhttpRequest(details);
        },

        ${h?"unsafeWindow: unsafeWindow":""}
    };

    const __wBlockLegacyGM = {
        getValue: GM.getValue.bind(GM),
        setValue: GM.setValue.bind(GM),
        deleteValue: GM.deleteValue.bind(GM),
        listValues: GM.listValues.bind(GM),
        getResourceURL: GM.getResourceURL.bind(GM),
        getResourceUrl: GM.getResourceUrl.bind(GM),
        getResourceText: GM.getResourceText.bind(GM),
        xmlhttpRequest: GM.xmlhttpRequest.bind(GM)
    };

    const __wBlockGMRequestPromise = (details) => {
        let requestHandle = null;
        const promise = new Promise((resolve, reject) => {
            const requestDetails = Object.assign({}, details || {});
            const originalOnload = requestDetails.onload;
            const originalOnerror = requestDetails.onerror;
            const originalOntimeout = requestDetails.ontimeout;
            const originalOnabort = requestDetails.onabort;

            requestDetails.onload = function(response) {
                try {
                    if (typeof originalOnload === 'function') originalOnload.call(this, response);
                } finally {
                    resolve(response);
                }
            };
            requestDetails.onerror = function(response) {
                try {
                    if (typeof originalOnerror === 'function') originalOnerror.call(this, response);
                } finally {
                    reject(response);
                }
            };
            requestDetails.ontimeout = function(response) {
                try {
                    if (typeof originalOntimeout === 'function') originalOntimeout.call(this, response);
                } finally {
                    reject(response);
                }
            };
            requestDetails.onabort = function(response) {
                try {
                    if (typeof originalOnabort === 'function') originalOnabort.call(this, response);
                } finally {
                    reject(response);
                }
            };

            requestHandle = __wBlockLegacyGM.xmlhttpRequest(requestDetails);
        });
        promise.abort = function() {
            if (requestHandle && typeof requestHandle.abort === 'function') {
                requestHandle.abort();
            }
        };
        return promise;
    };

    GM.getValue = function(key, defaultValue) {
        return Promise.resolve(__wBlockLegacyGM.getValue(key, defaultValue));
    };
    GM.setValue = function(key, value) {
        __wBlockLegacyGM.setValue(key, value);
        return Promise.resolve();
    };
    GM.deleteValue = function(key) {
        __wBlockLegacyGM.deleteValue(key);
        return Promise.resolve();
    };
    GM.listValues = function() {
        return Promise.resolve(__wBlockLegacyGM.listValues());
    };
    GM.getResourceURL = function(resourceName) {
        return Promise.resolve(__wBlockLegacyGM.getResourceURL(resourceName));
    };
    GM.getResourceUrl = function(resourceName) {
        return Promise.resolve(__wBlockLegacyGM.getResourceUrl(resourceName));
    };
    GM.getResourceText = function(resourceName) {
        return Promise.resolve(__wBlockLegacyGM.getResourceText(resourceName));
    };
    GM.xmlhttpRequest = __wBlockGMRequestPromise;
    GM.xmlHttpRequest = __wBlockGMRequestPromise;

    const GM_info = GM.info;
    const GM_getValue = __wBlockLegacyGM.getValue;
    const GM_setValue = __wBlockLegacyGM.setValue;
    const GM_deleteValue = __wBlockLegacyGM.deleteValue;
    const GM_listValues = __wBlockLegacyGM.listValues;
    const GM_getResourceURL = __wBlockLegacyGM.getResourceURL;
    const GM_getResourceUrl = __wBlockLegacyGM.getResourceUrl;
    const GM_getResourceText = __wBlockLegacyGM.getResourceText;
    const GM_addElement = GM.addElement;
    const GM_addValueChangeListener = GM.addValueChangeListener;
    const GM_removeValueChangeListener = GM.removeValueChangeListener;
    const GM_addStyle = GM.addStyle;
    const GM_setClipboard = GM.setClipboard;
    const GM_openInTab = GM.openInTab;
    const GM_notification = GM.notification;
    const GM_download = GM.download;
    const GM_xmlhttpRequest = __wBlockLegacyGM.xmlhttpRequest;
    const GM_xmlHttpRequest = __wBlockLegacyGM.xmlhttpRequest;
    const GM_registerMenuCommand = GM.registerMenuCommand;
    const GM_unregisterMenuCommand = GM.unregisterMenuCommand;

    ${a?`
    ${u}
    // Expose GM globals where the page can read them. Content-context scripts keep
    // these in the isolated world; AdGuard Popup Blocker's options page polls for
    // page-visible GM_* functions to decide whether the userscript is installed.
    window.GM_info = GM_info;
    window.GM = GM;

    // Legacy GM function aliases
    window.GM_getValue = GM_getValue;
    window.GM_setValue = GM_setValue;
    window.GM_deleteValue = GM_deleteValue;
    window.GM_listValues = GM_listValues;
    window.GM_getResourceURL = GM_getResourceURL;
    window.GM_getResourceUrl = GM_getResourceUrl;
    window.GM_getResourceText = GM_getResourceText;
    window.GM_addElement = GM_addElement;
    window.GM_addValueChangeListener = GM_addValueChangeListener;
    window.GM_removeValueChangeListener = GM_removeValueChangeListener;
    window.GM_addStyle = GM_addStyle;
    window.GM_setClipboard = GM_setClipboard;
    window.GM_openInTab = GM_openInTab;
    window.GM_notification = GM_notification;
    window.GM_download = GM_download;
    window.GM_xmlhttpRequest = GM_xmlhttpRequest;
    window.GM_xmlHttpRequest = GM_xmlHttpRequest;
    window.GM_registerMenuCommand = GM_registerMenuCommand;
    window.GM_unregisterMenuCommand = GM_unregisterMenuCommand;
    ${d}
    `:""}

    var __wBlockRunUserScript = function() {
        ${e.content}
    };

    try {
        __wBlockRunUserScript();
        wBlockLog('[wBlock UserScript] Finished executing: ${m(e.name)}');
    } catch (error) {
        wBlockError('[wBlock UserScript Execution Error] in ${m(e.name)}:', error);
        wBlockError('[wBlock UserScript Error Stack]:', error.stack);

        // Show a console warning for userscript errors
        wBlockWarn('[wBlock] Error in userscript "${m(e.name)}": ' + (error && error.message ? error.message : String(error)));
    }
})();
        `}}new i}})();
