// Loader content script: injects profiler.js into the page context and bridges popup requests
(function injectProfilerScript() {
  const url = chrome.runtime.getURL('profiler.js');
  const script = document.createElement('script');
  script.src = url;
  script.onload = function () { this.remove(); };
  (document.head || document.documentElement).appendChild(script);
})();

// CSP-safe bridge: relay getTimings requests from popup to profiler.js via window.postMessage
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'getTimings') {
    // Generate a unique request ID for this response
    const reqId = Math.random().toString(36).slice(2);
    function handleProfilerResponse(event) {
      if (event.source !== window) return;
      if (event.data && event.data.type === 'JS_PROFILER_TIMINGS_RESPONSE' && event.data.reqId === reqId) {
        window.removeEventListener('message', handleProfilerResponse);
        sendResponse(event.data.timings);
      }
    }
    window.addEventListener('message', handleProfilerResponse);
    window.postMessage({ type: 'JS_PROFILER_GET_TIMINGS', reqId }, '*');
    return true; // async response
  }
  if (msg && msg.type === 'getMemorySamples') {
    const reqId = Math.random().toString(36).slice(2);
    function handleMemoryResponse(event) {
      if (event.source !== window) return;
      if (event.data && event.data.type === 'JS_PROFILER_MEMORY_RESPONSE' && event.data.reqId === reqId) {
        window.removeEventListener('message', handleMemoryResponse);
        sendResponse(event.data.memorySamples);
      }
    }
    window.addEventListener('message', handleMemoryResponse);
    window.postMessage({ type: 'JS_PROFILER_GET_MEMORY', reqId }, '*');
    return true;
  }
  return false;
});
