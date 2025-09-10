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
  if (msg && msg.type === 'getEventLoopLags') {
    const reqId = Math.random().toString(36).slice(2);
    function handleLagResponse(event) {
      if (event.source !== window) return;
      if (event.data && event.data.type === 'JS_PROFILER_EVENT_LOOP_LAGS_RESPONSE' && event.data.reqId === reqId) {
        window.removeEventListener('message', handleLagResponse);
        sendResponse(event.data.eventLoopLags);
      }
    }
    window.addEventListener('message', handleLagResponse);
    window.postMessage({ type: 'JS_PROFILER_GET_EVENT_LOOP_LAGS', reqId }, '*');
    return true;
  }
  if (msg && msg.type === 'getFrameTimes') {
    const reqId = Math.random().toString(36).slice(2);
    function handleFrameResponse(event) {
      if (event.source !== window) return;
      if (event.data && event.data.type === 'JS_PROFILER_FRAME_TIMES_RESPONSE' && event.data.reqId === reqId) {
        window.removeEventListener('message', handleFrameResponse);
        sendResponse(event.data.frameTimes);
      }
    }
    window.addEventListener('message', handleFrameResponse);
    window.postMessage({ type: 'JS_PROFILER_GET_FRAME_TIMES', reqId }, '*');
    return true;
  }
  return false;
});
