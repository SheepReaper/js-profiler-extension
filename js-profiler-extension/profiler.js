// Profiler code injected as an external script into the page context
(function () {
  window.__jsProfiler = {
    timings: [],
    memorySamples: [],
    eventLoopLags: [],
    frameTimes: [],
    record: function (fn, name) {
      return function (...args) {
        const start = performance.now();
        const result = fn.apply(this, args);
        const end = performance.now();
        // Capture stack trace (skip this record wrapper)
        const stack = (new Error()).stack
          .split('\n')
          .slice(2)
          .join('\n');
        window.__jsProfiler.timings.push({
          name,
          duration: end - start,
          timestamp: Date.now(),
          stack
        });
        // Record memory usage after each call
        if (performance.memory) {
          window.__jsProfiler.memorySamples.push({
            timestamp: Date.now(),
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize
          });
        }
        return result;
      };
    }
  };
  // Event loop lag sampling
  (function eventLoopLagSampler() {
    let last = performance.now();
    function check() {
      const now = performance.now();
      const lag = now - last - 50;
      window.__jsProfiler.eventLoopLags.push({ timestamp: Date.now(), lag: lag > 0 ? lag : 0 });
      last = now;
      setTimeout(check, 50);
    }
    setTimeout(check, 50);
  })();

  // Frame rendering sampling
  (function frameTimeSampler() {
    let last = performance.now();
    function frame(now) {
      const dt = now - last;
      if (last !== 0) {
        window.__jsProfiler.frameTimes.push({ timestamp: Date.now(), frameTime: dt });
      }
      last = now;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  // Periodic memory sampling
  if (performance.memory) {
    setInterval(() => {
      window.__jsProfiler.memorySamples.push({
        timestamp: Date.now(),
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize
      });
    }, 500);
  }
  window.alert = window.__jsProfiler.record(window.alert, 'alert');
  const origAddEventListener = Element.prototype.addEventListener;
  Element.prototype.addEventListener = window.__jsProfiler.record(origAddEventListener, 'addEventListener');
  const origDocAddEventListener = Document.prototype.addEventListener;
  Document.prototype.addEventListener = window.__jsProfiler.record(origDocAddEventListener, 'doc.addEventListener');
  const origQuerySelector = Document.prototype.querySelector;
  Document.prototype.querySelector = window.__jsProfiler.record(origQuerySelector, 'querySelector');
  const origSetTimeout = window.setTimeout;
  window.setTimeout = window.__jsProfiler.record(origSetTimeout, 'setTimeout');
  if (window.fetch) {
    const origFetch = window.fetch;
    window.fetch = window.__jsProfiler.record(origFetch, 'fetch');
  }
  const origCreateElement = Document.prototype.createElement;
  Document.prototype.createElement = window.__jsProfiler.record(origCreateElement, 'createElement');
  const origAppendChild = Element.prototype.appendChild;
  Element.prototype.appendChild = window.__jsProfiler.record(origAppendChild, 'appendChild');
  const origRemoveChild = Element.prototype.removeChild;
  Element.prototype.removeChild = window.__jsProfiler.record(origRemoveChild, 'removeChild');
  const origSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = window.__jsProfiler.record(origSetAttribute, 'setAttribute');
  const origXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = window.__jsProfiler.record(origXHROpen, 'xhr.open');
  const origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = window.__jsProfiler.record(origXHRSend, 'xhr.send');
  // Listen for getTimings, getMemory, getEventLoopLags, getFrameTimes requests from loader.js
  window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    if (event.data && event.data.type === 'JS_PROFILER_GET_TIMINGS') {
      window.postMessage({
        type: 'JS_PROFILER_TIMINGS_RESPONSE',
        reqId: event.data.reqId,
        timings: window.__jsProfiler.timings || []
      }, '*');
    }
    if (event.data && event.data.type === 'JS_PROFILER_GET_MEMORY') {
      window.postMessage({
        type: 'JS_PROFILER_MEMORY_RESPONSE',
        reqId: event.data.reqId,
        memorySamples: window.__jsProfiler.memorySamples || []
      }, '*');
    }
    if (event.data && event.data.type === 'JS_PROFILER_GET_EVENT_LOOP_LAGS') {
      window.postMessage({
        type: 'JS_PROFILER_EVENT_LOOP_LAGS_RESPONSE',
        reqId: event.data.reqId,
        eventLoopLags: window.__jsProfiler.eventLoopLags || []
      }, '*');
    }
    if (event.data && event.data.type === 'JS_PROFILER_GET_FRAME_TIMES') {
      window.postMessage({
        type: 'JS_PROFILER_FRAME_TIMES_RESPONSE',
        reqId: event.data.reqId,
        frameTimes: window.__jsProfiler.frameTimes || []
      }, '*');
    }
  });
  console.log('[JS Profiler Extension] profiler injected in page context (external script)');
})();
