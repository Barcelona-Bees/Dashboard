# Beehive Sensors — React PWA Starter (Vite + Tailwind + Recharts)

**Theme:** Orange (#ff6600) / black.  
**Pages:** Dashboard, Alerts, Admin.  
**Data:** Static mocks in `/public/mock` (swap to API later).

## Quickstart
```bash
npm i
npm run dev
```
Open http://localhost:5173

## Tech
- Vite + React + TypeScript
- TailwindCSS (see `tailwind.config.cjs`)
- Recharts for line charts
- PWA: `manifest.webmanifest` + simple `sw.js` (cache-first)

## Wire-up to your API
Update `src/services/api.ts` to call your backend:
```ts
const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'
const r = await fetch(`${ ' }}BASE{{ ' }/readings?sensor_id=1&since=48h`)
```

## Pages
- **Dashboard:** last 48h temperature line chart, KPI cards
- **Alerts:** list of open/recent alerts
- **Admin:** device registry with battery + last seen

## Folder Structure
```
beehive-pwa-starter/
  public/
    manifest.webmanifest
    sw.js
    mock/ (sample JSON)
  src/
    pages/ (Dashboard, Alerts, Admin)
    components/
    services/api.ts
    styles/index.css
  tailwind.config.cjs
  postcss.config.cjs
  vite.config.ts
  tsconfig.json
  package.json
```
