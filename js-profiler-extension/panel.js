// Fetch and render memory usage chart
// Fetch and render event loop lag chart
function renderEventLoopLagChart() {
  let didRespond = false;
  const timeout = setTimeout(() => {
    if (!didRespond) {
      document.getElementById('eventloop') && (document.getElementById('eventloop').innerHTML = '<div class="has-text-danger">Failed to fetch event loop lag data (timeout or port closed).</div>');
    }
  }, 1200);
  function tryGetEventLoopLags(retry) {
    chrome.tabs.sendMessage(
      chrome.devtools.inspectedWindow.tabId,
      { type: 'getEventLoopLags' },
      (lags) => {
        didRespond = true;
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          if (!retry && chrome.runtime.lastError.message && chrome.runtime.lastError.message.includes('Could not establish connection')) {
            chrome.scripting.executeScript({
              target: { tabId: chrome.devtools.inspectedWindow.tabId },
              files: ['loader.js']
            }, () => {
              setTimeout(() => tryGetEventLoopLags(true), 300);
            });
            return;
          }
          document.getElementById('eventloop') && (document.getElementById('eventloop').innerHTML = `<div class="has-text-danger">Error: ${chrome.runtime.lastError.message || 'Message port closed or extension context lost.'}</div>`);
          return;
        }
        if (!lags || !lags.length) {
          document.getElementById('eventloop') && (document.getElementById('eventloop').innerHTML = '<div class="has-text-grey">No event loop lag data available.</div>');
          return;
        }
        // Prepare data
        const minTime = Math.min(...lags.map(s => s.timestamp));
        const maxTime = Math.max(...lags.map(s => s.timestamp));
        const minLag = Math.min(...lags.map(s => s.lag));
        const maxLag = Math.max(...lags.map(s => s.lag));
        const width = 320, height = 100, pad = 24;
        // SVG line chart
        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
        svg += '<polyline fill="none" stroke="#43a047" stroke-width="2" points="';
        for (let i = 0; i < lags.length; ++i) {
          const x = pad + (width - 2 * pad) * (lags[i].timestamp - minTime) / (maxTime - minTime || 1);
          const y = height - pad - (height - 2 * pad) * (lags[i].lag - minLag) / (maxLag - minLag || 1);
          svg += `${x},${y} `;
        }
        svg += '"/>';
        svg += '</svg>';
        let html = `<h4 class="title is-6 mt-5 mb-2">Event Loop Lag</h4><div class="box" style="max-width:340px;margin:0 auto 24px auto;">${svg}<div style="font-size:12px;text-align:center;margin-top:8px;">Lag (ms): ${minLag.toFixed(2)} - ${maxLag.toFixed(2)}</div></div>`;
        document.getElementById('eventloop') ? document.getElementById('eventloop').innerHTML = html : (document.getElementById('cpu').insertAdjacentHTML('afterend', `<div id="eventloop">${html}</div>`));
      }
    );
  }
  tryGetEventLoopLags(false);
}

// Fetch and render frame rendering chart
function renderFrameTimesChart() {
  let didRespond = false;
  const timeout = setTimeout(() => {
    if (!didRespond) {
      document.getElementById('frames') && (document.getElementById('frames').innerHTML = '<div class="has-text-danger">Failed to fetch frame rendering data (timeout or port closed).</div>');
    }
  }, 1200);
  function tryGetFrameTimes(retry) {
    chrome.tabs.sendMessage(
      chrome.devtools.inspectedWindow.tabId,
      { type: 'getFrameTimes' },
      (frames) => {
        didRespond = true;
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          if (!retry && chrome.runtime.lastError.message && chrome.runtime.lastError.message.includes('Could not establish connection')) {
            chrome.scripting.executeScript({
              target: { tabId: chrome.devtools.inspectedWindow.tabId },
              files: ['loader.js']
            }, () => {
              setTimeout(() => tryGetFrameTimes(true), 300);
            });
            return;
          }
          document.getElementById('frames') && (document.getElementById('frames').innerHTML = `<div class="has-text-danger">Error: ${chrome.runtime.lastError.message || 'Message port closed or extension context lost.'}</div>`);
          return;
        }
        if (!frames || !frames.length) {
          document.getElementById('frames') && (document.getElementById('frames').innerHTML = '<div class="has-text-grey">No frame rendering data available.</div>');
          return;
        }
        // Prepare data
        const minTime = Math.min(...frames.map(s => s.timestamp));
        const maxTime = Math.max(...frames.map(s => s.timestamp));
        const minFrame = Math.min(...frames.map(s => s.frameTime));
        const maxFrame = Math.max(...frames.map(s => s.frameTime));
        const width = 320, height = 100, pad = 24;
        // SVG line chart
        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
        svg += '<polyline fill="none" stroke="#ff9800" stroke-width="2" points="';
        for (let i = 0; i < frames.length; ++i) {
          const x = pad + (width - 2 * pad) * (frames[i].timestamp - minTime) / (maxTime - minTime || 1);
          const y = height - pad - (height - 2 * pad) * (frames[i].frameTime - minFrame) / (maxFrame - minFrame || 1);
          svg += `${x},${y} `;
        }
        svg += '"/>';
        svg += '</svg>';
        let html = `<h4 class="title is-6 mt-5 mb-2">Frame Rendering Times</h4><div class="box" style="max-width:340px;margin:0 auto 24px auto;">${svg}<div style="font-size:12px;text-align:center;margin-top:8px;">Frame Time (ms): ${minFrame.toFixed(2)} - ${maxFrame.toFixed(2)}</div></div>`;
        document.getElementById('frames') ? document.getElementById('frames').innerHTML = html : (document.getElementById('cpu').insertAdjacentHTML('afterend', `<div id="frames">${html}</div>`));
      }
    );
  }
  tryGetFrameTimes(false);
}
function renderMemoryChart() {
  let didRespond = false;
  // Set a timeout in case the message port closes or no response is received
  const timeout = setTimeout(() => {
    if (!didRespond) {
      document.getElementById('memory') && (document.getElementById('memory').innerHTML = '<div class="has-text-danger">Failed to fetch memory data (timeout or port closed).</div>');
    }
  }, 1200);
  function tryGetMemorySamples(retry) {
    chrome.tabs.sendMessage(
      chrome.devtools.inspectedWindow.tabId,
      { type: 'getMemorySamples' },
      (samples) => {
        didRespond = true;
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          // If the error is connection, try to inject loader.js and retry once
          if (!retry && chrome.runtime.lastError.message && chrome.runtime.lastError.message.includes('Could not establish connection')) {
            chrome.scripting.executeScript({
              target: { tabId: chrome.devtools.inspectedWindow.tabId },
              files: ['loader.js']
            }, () => {
              setTimeout(() => tryGetMemorySamples(true), 300);
            });
            return;
          }
          document.getElementById('memory') && (document.getElementById('memory').innerHTML = `<div class="has-text-danger">Error: ${chrome.runtime.lastError.message || 'Message port closed or extension context lost.'}</div>`);
          return;
        }
        if (!samples || !samples.length) {
          document.getElementById('memory') && (document.getElementById('memory').innerHTML = '<div class="has-text-grey">No memory data available.</div>');
          return;
        }
        // Prepare data
        const minTime = Math.min(...samples.map(s => s.timestamp));
        const maxTime = Math.max(...samples.map(s => s.timestamp));
        const minUsed = Math.min(...samples.map(s => s.used));
        const maxUsed = Math.max(...samples.map(s => s.used));
        const width = 320, height = 100, pad = 24;
        // Detect GC events (drop > 5% of max)
        let last = samples[0].used;
        const gcEvents = [];
        for (let i = 1; i < samples.length; ++i) {
          if (last - samples[i].used > 0.05 * maxUsed) {
            gcEvents.push(i);
          }
          last = samples[i].used;
        }
        // SVG line chart
        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
        // Memory line
        svg += '<polyline fill="none" stroke="#1976d2" stroke-width="2" points="';
        for (let i = 0; i < samples.length; ++i) {
          const x = pad + (width - 2 * pad) * (samples[i].timestamp - minTime) / (maxTime - minTime || 1);
          const y = height - pad - (height - 2 * pad) * (samples[i].used - minUsed) / (maxUsed - minUsed || 1);
          svg += `${x},${y} `;
        }
        svg += '"/>';
        // GC event markers
        for (const i of gcEvents) {
          const x = pad + (width - 2 * pad) * (samples[i].timestamp - minTime) / (maxTime - minTime || 1);
          svg += `<rect x="${x - 2}" y="${height - pad - 40}" width="4" height="40" fill="#e53935" opacity="0.5"><title>GC event</title></rect>`;
        }
        svg += '</svg>';
        let html = `<h4 class="title is-6 mt-5 mb-2">Memory Usage</h4><div class="box" style="max-width:340px;margin:0 auto 24px auto;">${svg}<div style="font-size:12px;text-align:center;margin-top:8px;">Heap Used (MB): ${(minUsed / 1048576).toFixed(1)} - ${(maxUsed / 1048576).toFixed(1)}</div></div>`;
        document.getElementById('memory') ? document.getElementById('memory').innerHTML = html : (document.getElementById('cpu').insertAdjacentHTML('afterend', `<div id="memory">${html}</div>`));
      }
    );
  }
  tryGetMemorySamples(false);
}
// Call memory chart rendering after timings are rendered
// Panel script: fetches and displays profiling data in DevTools



let lastTimings = [];
let selectedFunction = null;
let stackFnList = [];

function renderProfilerData(timings) {
  renderMemoryChart();
  // Group by function name
  const groups = {};
  for (const t of timings) {
    if (!groups[t.name]) groups[t.name] = [];
    groups[t.name].push(t);
  }
  // Populate stack trace function dropdown
  stackFnList = Object.keys(groups).sort();
  const stackSelect = document.getElementById('stack-fn-select');
  if (stackSelect) {
    stackSelect.innerHTML = '';
    if (stackFnList.length === 0) {
      stackSelect.innerHTML = '<option disabled selected>No functions available</option>';
      selectedFunction = null;
      document.getElementById('stacks').innerHTML = '<div class="has-text-grey">No functions available. Run code to collect data.</div>';
    } else {
      for (const fn of stackFnList) {
        const opt = document.createElement('option');
        opt.value = fn;
        opt.textContent = fn;
        if (selectedFunction === fn) opt.selected = true;
        stackSelect.appendChild(opt);
      }
      // If no function selected, default to first
      if (!selectedFunction || !stackFnList.includes(selectedFunction)) {
        selectedFunction = stackFnList[0];
      }
      showStackTraces(selectedFunction);
    }
    // Always attach event listener after populating
    stackSelect.onchange = function () {
      selectedFunction = this.value;
      showStackTraces(selectedFunction);
    };
  }
  // CPU Usage Breakdown
  const totalTime = timings.reduce((sum, t) => sum + t.duration, 0) || 1;
  const cpuStats = Object.entries(groups).map(([name, arr]) => {
    const total = arr.reduce((sum, t) => sum + t.duration, 0);
    return { name, total, percent: (total / totalTime * 100) };
  }).sort((a, b) => b.total - a.total);

  // CPU Usage Table (Bulma)
  let cpuHtml = '<h4 class="title is-6 mt-5 mb-2">CPU Usage Breakdown</h4>';
  cpuHtml += '<table class="table is-narrow is-fullwidth"><thead><tr><th>Function</th><th>Total Time (ms)</th><th>% of Profiled</th></tr></thead><tbody>';
  for (const s of cpuStats) {
    cpuHtml += `<tr><td>${s.name}</td><td>${s.total.toFixed(2)}</td><td>${s.percent.toFixed(1)}%</td></tr>`;
  }
  cpuHtml += '</tbody></table>';
  document.getElementById('cpu') ? document.getElementById('cpu').innerHTML = cpuHtml : (document.getElementById('barchart').insertAdjacentHTML('afterend', `<div id="cpu">${cpuHtml}</div>`));

  // Pie chart (SVG, Bulma box)
  let pieHtml = '<div class="box" style="max-width:320px;margin:0 auto 24px auto;"><svg width="160" height="160" viewBox="0 0 32 32">';
  let acc = 0;
  for (const s of cpuStats) {
    const start = acc;
    const end = acc + s.percent / 100 * 360;
    const large = end - start > 180 ? 1 : 0;
    const x1 = 16 + 16 * Math.cos(Math.PI * start / 180);
    const y1 = 16 + 16 * Math.sin(Math.PI * start / 180);
    const x2 = 16 + 16 * Math.cos(Math.PI * end / 180);
    const y2 = 16 + 16 * Math.sin(Math.PI * end / 180);
    const color = `hsl(${(s.name.length * 47) % 360},70%,60%)`;
    pieHtml += `<path d="M16,16 L${x1},${y1} A16,16 0 ${large} 1 ${x2},${y2} Z" fill="${color}" stroke="#fff" stroke-width="0.5"><title>${s.name}: ${s.percent.toFixed(1)}%</title></path>`;
    acc = end;
  }
  pieHtml += '</svg><div style="font-size:12px;text-align:center;margin-top:8px;">CPU Usage by Function</div></div>';
  document.getElementById('cpu') ? document.getElementById('cpu').insertAdjacentHTML('beforeend', pieHtml) : (document.getElementById('barchart').insertAdjacentHTML('afterend', pieHtml));
  lastTimings = timings;
  if (!timings || !timings.length) {
    document.getElementById('output').textContent = 'No data.';
    document.getElementById('table').innerHTML = '';
    document.getElementById('barchart').innerHTML = '';
    document.getElementById('timeline').innerHTML = '';
    document.getElementById('output').style.display = '';
    return;
  }
  // Compute stats
  const stats = Object.entries(groups).map(([name, arr]) => {
    const count = arr.length;
    const durations = arr.map(t => t.duration);
    const min = Math.min(...durations).toFixed(2);
    const max = Math.max(...durations).toFixed(2);
    const avg = (durations.reduce((a, b) => a + b, 0) / count).toFixed(2);
    return { name, count, min, max, avg };
  });
  // Table with clickable rows (Bulma)
  let tableHtml = '<table class="table is-striped is-hoverable is-fullwidth"><thead><tr><th>Function</th><th>Count</th><th>Min (ms)</th><th>Max (ms)</th><th>Avg (ms)</th></tr></thead><tbody>';
  for (const s of stats) {
    tableHtml += `<tr class="fn-row" data-fn="${encodeURIComponent(s.name)}" style="cursor:pointer;"><td>${s.name}</td><td>${s.count}</td><td>${s.min}</td><td>${s.max}</td><td>${s.avg}</td></tr>`;
  }
  tableHtml += '</tbody></table>';
  document.getElementById('table').innerHTML = tableHtml;
  // Bar chart (Bulma)
  const maxCount = Math.max(...stats.map(s => s.count));
  let barHtml = '<h4 class="title is-6 mt-5 mb-2">Call Frequency</h4>';
  for (const s of stats) {
    const barWidth = (s.count / maxCount * 100);
    barHtml += `<div class="mb-1" style="font-size:12px;">${s.name} <span class="tag is-light is-info ml-1">${s.count}</span> <span class="bar" style="width:${barWidth}%"></span></div>`;
  }
  document.getElementById('barchart').innerHTML = barHtml;
  // Timeline (Bulma heading)
  const minTime = Math.min(...timings.map(t => t.timestamp));
  const maxTime = Math.max(...timings.map(t => t.timestamp + t.duration));
  const totalSpan = maxTime - minTime || 1;
  let timelineHtml = '<h4 class="title is-6 mt-5 mb-2">Timeline</h4>';
  timelineHtml += '<div class="timeline">';
  for (const t of timings) {
    const left = ((t.timestamp - minTime) / totalSpan) * 100;
    const width = (t.duration / totalSpan) * 100;
    timelineHtml += `<div title="${t.name} (${t.duration.toFixed(2)}ms)" class="timeline-bar" style="top:${5 + (Math.random() * 100)}px;left:${left}%;width:${Math.max(width, 0.5)}%;"></div>`;
  }
  timelineHtml += '</div>';
  document.getElementById('timeline').innerHTML = timelineHtml;
  document.getElementById('output').textContent = '';
  document.getElementById('output').style.display = 'none';

  // Add click listeners for drill-down
  for (const row of document.querySelectorAll('.fn-row')) {
    row.onclick = function () {
      const fn = decodeURIComponent(this.getAttribute('data-fn'));
      selectedFunction = fn;
      setActiveTab('stacks');
      // Set dropdown to this function
      const stackSelect = document.getElementById('stack-fn-select');
      if (stackSelect) {
        stackSelect.value = fn;
      }
      showStackTraces(fn);
    };
  }

  // No need to keep function highlighted in table or auto-show stack traces unless in stacks tab
  document.getElementById('output').innerHTML = '';
  document.getElementById('output').style.display = 'none';
}

function showStackTraces(fnName) {
  const traces = lastTimings.filter(t => t.name === fnName && t.stack).map(t => t.stack);
  const uniqueTraces = Array.from(new Set(traces));
  let html = `<h4 class="title is-6">Stack Traces for <span class="has-text-link">${fnName}</span></h4>`;
  if (!uniqueTraces.length) {
    html += '<div class="has-text-grey">No stack traces available.</div>';
  } else {
    html += '<div class="box" style="max-height:200px;overflow:auto;font-size:12px;">';
    for (const stack of uniqueTraces.slice(0, 10)) {
      html += `<pre class="mb-2">${stack}</pre>`;
    }
    if (uniqueTraces.length > 10) html += `<div class="has-text-grey">...and ${uniqueTraces.length - 10} more</div>`;
    html += '</div>';
  }
  document.getElementById('stacks').innerHTML = html;

}
// Tab switching logic
function setActiveTab(tab) {
  // Set active tab
  for (const li of document.querySelectorAll('#profiler-tabs li')) {
    if (li.dataset.tab === tab) {
      li.classList.add('is-active');
    } else {
      li.classList.remove('is-active');
    }
  }
  // Show/hide tab content
  for (const div of document.querySelectorAll('.profiler-tab-content')) {
    if (div.id === `tab-content-${tab}`) {
      div.style.display = '';
    } else {
      div.style.display = 'none';
    }
  }
}

document.getElementById('profiler-tabs').onclick = function (e) {
  const li = e.target.closest('li[data-tab]');
  if (!li) return;
  setActiveTab(li.dataset.tab);
};

// Auto-refresh on load, default to Table tab
// Render new metrics on load
renderEventLoopLagChart();
renderFrameTimesChart();
setActiveTab('table');

document.getElementById('refresh').onclick = async () => {
  chrome.devtools.inspectedWindow.eval(
    'window.__jsProfiler ? window.__jsProfiler.timings : []',
    (result, isException) => {
      if (isException) {
        document.getElementById('output').textContent = 'Error';
        return;
      }
      renderProfilerData(result);
    }
  );
  renderMemoryChart();
  renderEventLoopLagChart();
  renderFrameTimesChart();
};

// Auto-refresh on load
document.getElementById('refresh').click();
