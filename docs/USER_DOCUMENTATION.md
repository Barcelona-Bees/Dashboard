# Barcelona Bees Dashboard - User Documentation

## Purpose

The Barcelona Bees Dashboard helps beekeepers monitor hive health using sensor data (temperature and humidity), track alerts, and review historical trends.

---

## Main screens

## Home
- Shows current readings and status:
  - outside temperature (weather-backed when available)
  - inside hive temperature
  - humidity
  - hardware/connectivity health
- Displays today's alerts with filtering and pagination.

## Activity & Alerts
- Shows threshold and connectivity alerts over the configured history window.
- Supports notification filtering:
  - all
  - critical
  - warning
  - connectivity
  - temperature
  - humidity

## Data Overview
- Displays last 14 local calendar days of trends.
- Daily averages are charted for readability.
- Export includes full raw merged readings (CSV, JSON, XLSX, PDF print flow).

---

## How to use the dashboard

1. Open the dashboard in your browser.
2. Start on Home to verify current readings and online/offline status.
3. Review today's alerts and optionally filter by type/severity.
4. Open Activity & Alerts to review recent history.
5. Open Data Overview to analyze trends and export data for reports.

---

## Understanding updates

- The dashboard refreshes quickly after new uploads via server-sent events.
- If live events are unavailable, background polling still updates the UI.
- Home and Alerts views cache the last successful snapshot for faster reloads.

---

## Exporting data

From Data Overview:
1. Click Export.
2. Choose columns (temperature and/or humidity).
3. Choose format (CSV/JSON/XLSX/PDF).
4. Download.

---

## Common issues

## "No data" or API error
- Backend may be down.
- API base URL may be misconfigured.

## Uploads succeed but UI does not immediately change
- Check SSE connectivity.
- Wait for fallback polling interval or refresh manually.

## Invalid passkey on uploads
- Ensure upload passkey matches hive passkey in database.

