# Barcelona Bees Dashboard - System Documentation

## System overview

This system is a full-stack IoT monitoring application:

- Frontend: React + Vite SPA
- Backend: Express API
- Database: PostgreSQL
- Data sources:
  - sensor uploads via API
  - Open-Meteo weather API for outside temperature context

Primary objective: ingest hive telemetry and render actionable operational monitoring (current state, trends, alerts).

---

## High-level architecture

1. Sensor/device or script submits reading payloads to upload endpoints.
2. Backend validates passkey and payload shape.
3. Backend writes readings to PostgreSQL.
4. Backend notifies connected clients through SSE.
5. Frontend refetches and transforms data into charts/KPIs/alerts.
6. Frontend stores recent successful snapshots in localStorage for fast reloads.

---

## Backend responsibilities

- Expose REST endpoints for:
  - temperature/humidity measurement queries
  - range windows (day/week/two weeks/custom)
  - upload endpoints for new readings
- Maintain SSE stream on `/events/readings`.
- Handle date validation and hive start-date constraints.
- Verify DB connectivity on startup and log status.
- Serve built frontend (`dist`) when deployed in unified mode.

---

## Frontend responsibilities

- Fetch latest and historical readings from API.
- Merge temperature and humidity timelines.
- Compute and display:
  - KPI cards
  - 24-hour comparison chart
  - 14-day overview charts
  - alert/notification lists with filtering + pagination
- Integrate weather context from Open-Meteo through service layer.
- Provide export workflows for analytics/reporting.

---

## Data model notes

Core tables include:
- `Hive`
- `Temperature`
- `Humidity`
- `Users`
- `Notify`
- `UserHives`

Current production path is single-hive oriented in runtime defaults (`hiveid = 1`), while schema design already supports multi-hive expansion.

---

## Environment and configuration

Important runtime variables:
- `PORT`
- `VITE_API_BASE`
- `API_URL`
- `HIVE_PASSKEY`
- `DEMO_PUSH_INTERVAL_MS`
- `VITE_HOME_POLL_MS`
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
- optional: `PGSSL`, `PGSSLMODE`, `DEBUG_DB`, `TEST_DB`

Reference template: `.env.example`.

---

## Reliability and update strategy

- Primary refresh: SSE event after successful write.
- Secondary refresh: interval polling (Home screen fallback).
- Additional catch-up: visibility-based refresh when tab regains focus.
- Cache support: local snapshot hydration for improved UX after reload.

---

## Security considerations (current and next)

Current:
- Upload access protected by hive passkey.
- CORS is permissive (`*`) for development convenience.

Recommended next:
- Restrict CORS in production.
- Introduce authenticated user sessions/JWT.
- Enforce per-user hive authorization via `UserHives`.
- Add audit logging for critical actions and alert acknowledgements.

