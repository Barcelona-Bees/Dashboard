# Barcelona Bees Dashboard (JS, single-page tabs) — Wireframe Match

This is a **JavaScript (JSX)** Vite + React single-page dashboard that matches the provided wireframes:
- Home (Current Readings)
- Notifications (Alerts)
- All Data (Historical data + Export modal)
- Account

**Important:** Charts are currently **wireframe placeholders** (grid + sample lines) so everything renders reliably.
When you’re ready for real data, we can swap `ChartCard.jsx` to an accessible chart library (AG Charts, etc.) in ~5 minutes.

## Run it locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173)

## Notes
- Login is a simple local toggle (stored in localStorage) so you can click through screens.
- Data is placeholder in `src/data/fake.js` — swap with your real fake-data file later.
- This project is intentionally **single page with tabs** (no router).


## Gauges & charts
- Gauges are dial-style with colored target bands + a needle.
- Charts support hover, drag-to-scrub, and keyboard (Left/Right) to inspect points.
