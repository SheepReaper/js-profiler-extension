// Panel script: fetches and displays profiling data in DevTools



let lastTimings = [];
let selectedFunction = null;

function renderProfilerData(timings) {
  lastTimings = timings;
  if (!timings || !timings.length) {
    document.getElementById('output').textContent = 'No data.';
    document.getElementById('table').innerHTML = '';
    document.getElementById('barchart').innerHTML = '';
    document.getElementById('timeline').innerHTML = '';
    document.getElementById('output').style.display = '';
    return;
  }
  // Group by function name
  const groups = {};
  for (const t of timings) {
    if (!groups[t.name]) groups[t.name] = [];
    groups[t.name].push(t);
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
    tableHtml += `<tr class="fn-row" data-fn="${encodeURIComponent(s.name)}" style="cursor:pointer;${selectedFunction===s.name?'background:#e3f2fd;':''}"><td>${s.name}</td><td>${s.count}</td><td>${s.min}</td><td>${s.max}</td><td>${s.avg}</td></tr>`;
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
    timelineHtml += `<div title="${t.name} (${t.duration.toFixed(2)}ms)" class="timeline-bar" style="top:${5 + (Math.random()*100)}px;left:${left}%;width:${Math.max(width,0.5)}%;"></div>`;
  }
  timelineHtml += '</div>';
  document.getElementById('timeline').innerHTML = timelineHtml;
  document.getElementById('output').textContent = '';
  document.getElementById('output').style.display = 'none';

  // Add click listeners for drill-down
  for (const row of document.querySelectorAll('.fn-row')) {
    row.onclick = function() {
      const fn = decodeURIComponent(this.getAttribute('data-fn'));
      selectedFunction = fn;
      renderProfilerData(lastTimings);
      showStackTraces(fn);
    };
  }

  // If a function is selected, show stack traces
  if (selectedFunction) {
    showStackTraces(selectedFunction);
  } else {
    document.getElementById('output').innerHTML = '';
    document.getElementById('output').style.display = 'none';
  }
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
    if (uniqueTraces.length > 10) html += `<div class="has-text-grey">...and ${uniqueTraces.length-10} more</div>`;
    html += '</div>';
  }
  document.getElementById('output').innerHTML = html;
  document.getElementById('output').style.display = '';
}

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
};

// Auto-refresh on load
document.getElementById('refresh').click();
