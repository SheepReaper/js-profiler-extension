# JS Profiler Extension

A Chrome extension for profiling JavaScript function calls, DOM operations, and network activity on any web page. It visualizes call frequency, timing, and stack traces in a modern DevTools panel and popup.

## Features
- Instruments core browser and JavaScript APIs (e.g., createElement, setAttribute, addEventListener, setTimeout, fetch, XMLHttpRequest)
- Collects timing, call count, and stack trace data
- DevTools panel with grouped stats, bar chart, timeline, and stack trace drill-down
- Popup for quick summary
- No dependencies, no need for web store publishing

## How to Test the Extension (Unpacked)

1. **Clone or Download** this repository to your local machine.
2. **Open Chrome** and go to `chrome://extensions`.
3. **Enable Developer Mode** (toggle in the top right).
4. **Click "Load unpacked"** and select the `js-profiler-extension` folder.
5. The extension icon should appear in the Chrome toolbar.
6. **Open any website** (not a `chrome://` or the Chrome Web Store page).
7. **Open DevTools** (F12 or Ctrl+Shift+I) and go to the "JS Profiler" panel.
8. Interact with the page (click, type, etc.) to generate data.
9. Click **Refresh** in the panel to view grouped stats, bar chart, timeline, and stack traces.
10. Optionally, click the extension icon for a quick popup summary.

## Notes
- The extension does not require publishing to the Chrome Web Store for local testing.
- Some sites with strict Content Security Policy (CSP) may limit what can be instrumented, but the extension is designed to work on most HTTP/HTTPS pages.
- For best results, reload the target page after loading the extension.

## License
MIT
