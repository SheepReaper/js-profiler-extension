// Background service worker for JS Profiler Extension


chrome.runtime.onInstalled.addListener(() => {
  console.log('JS Profiler Extension installed.');
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'addTiming' && msg.timing) {
    chrome.storage.local.get({ profilerTimings: [] }, (data) => {
      const timings = data.profilerTimings;
      timings.push(msg.timing);
      if (timings.length > 1000) timings.shift();
      chrome.storage.local.set({ profilerTimings: timings });
    });
    return;
  }
  if (msg && msg.type === 'getTimings') {
    chrome.storage.local.get({ profilerTimings: [] }, (data) => {
      sendResponse(data.profilerTimings);
    });
    return true;
  }
});
