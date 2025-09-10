// Popup script: fetches and displays profiling data

document.getElementById('show').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { type: 'getTimings' }, (timings) => {
    if (!timings || !timings.length) {
      document.getElementById('profile').textContent = 'No data.';
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
    // Render table
    let html = '<table style="width:100%;font-size:12px"><tr><th>Function</th><th>Count</th><th>Min (ms)</th><th>Max (ms)</th><th>Avg (ms)</th></tr>';
    for (const s of stats) {
      html += `<tr><td>${s.name}</td><td>${s.count}</td><td>${s.min}</td><td>${s.max}</td><td>${s.avg}</td></tr>`;
    }
    html += '</table>';
    // Simple bar chart for call frequency
    const maxCount = Math.max(...stats.map(s => s.count));
    html += '<h4>Call Frequency</h4>';
    for (const s of stats) {
      const bar = '<span style="display:inline-block;background:#4caf50;height:12px;width:' + (s.count / maxCount * 100) + '%"></span>';
      html += `<div style="font-size:11px">${s.name} (${s.count}) ${bar}</div>`;
    }
    // Timeline visualization
    const minTime = Math.min(...timings.map(t => t.timestamp));
    const maxTime = Math.max(...timings.map(t => t.timestamp + t.duration));
    const totalSpan = maxTime - minTime || 1;
    html += '<h4>Timeline</h4>';
    html += '<div style="position:relative;height:120px;width:100%;background:#f5f5f5;border:1px solid #ccc;margin-bottom:8px;overflow-x:auto">';
    for (const t of timings) {
      const left = ((t.timestamp - minTime) / totalSpan) * 100;
      const width = (t.duration / totalSpan) * 100;
      html += `<div title="${t.name} (${t.duration.toFixed(2)}ms)" style="position:absolute;top:${5 + (Math.random()*100)}px;left:${left}%;width:${Math.max(width,0.5)}%;height:8px;background:#2196f3;border-radius:2px;"></div>`;
    }
    html += '</div>';
    document.getElementById('profile').innerHTML = html;
  });
};
