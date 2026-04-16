# Barcelona Bees Dashboard

Capstone IoT monitoring dashboard for beehive telemetry.

This project combines a React frontend, an Express API, and PostgreSQL storage to ingest temperature/humidity readings and present:

- live hive status
- historical trends
- threshold and connectivity alerts
- exportable data for reporting

---

## What this project does

- **Collects sensor readings** through API upload endpoints (`/upload/temp`, `/upload/Humidity`, `/uploadall/`)
- **Stores readings in PostgreSQL** with a seeded demo hive workflow
- **Shows current hive health** (inside/outside temp, humidity, connectivity, packet-loss estimate)
- **Builds historical dashboards** (14-day overview and alerts history)
- **Supports export** in CSV, JSON, XLSX, and print-to-PDF flows
- **Updates in near real time** using Server-Sent Events (SSE) plus timed polling fallback
- **Integrates weather context** using Open-Meteo hourly data (Rochester, NY) for outside-temperature comparison

---

## Tech stack

- **Frontend:** React 18 + Vite 7
- **Backend:** Node.js 20+ + Express 5
- **Database:** PostgreSQL
- **Testing:** Jest (unit + optional DB integration paths)

---

## Architecture overview

Data flow:

1. Sensor/script POSTs readings to Express upload endpoints.
2. Backend validates passkey and payload, writes to PostgreSQL.
3. Backend broadcasts an SSE `reading` event on `/events/readings`.
4. Frontend receives event and refreshes data (debounced), with periodic polling as backup.
5. UI computes charts/alerts and caches last successful snapshots in `localStorage`.

Primary files:

- Backend entrypoint: `src/backend/appLayer/al.js`
- DB connection/utilities: `src/backend/dataLinkLayer/dbutils.js`
- Frontend API client: `src/services/api.js`
- Home screen refresh logic: `src/screens/HomeScreen.jsx`
- Alerts logic/filtering: `src/services/alerts.js`
- Data overview/export: `src/screens/DataScreen.jsx`

---

## Prerequisites

- Node.js **20+**
- npm **9+**
- PostgreSQL **14+** (local or VM)

---

## Quick start (local development)

### 1) Install dependencies

```bash
npm install
cp .env.example .env
```

### 2) Configure environment

Update `.env` as needed. The defaults in `.env.example` are tuned for local development.

Minimum required for local:

```env
PORT=3001
VITE_API_BASE=http://localhost:3001
PGHOST=localhost
PGPORT=5432
PGDATABASE=siteinfo
PGUSER=student
PGPASSWORD=student
HIVE_PASSKEY=seed-demo-key
API_URL=http://localhost:3001
```

### 3) Initialize PostgreSQL

```bash
npm run db:setup
psql -U postgres -d siteinfo -f src/backend/database/database_initial.sql
npm run db:seed
```

Notes:

- `db:setup` creates role/database (`student` / `siteinfo`) if missing.
- `db:seed` inserts demo hive `hiveid=1` with passkey `seed-demo-key`.

### 4) Run backend and frontend

Terminal A (backend):

```bash
npm run dev:backend
```

Terminal B (frontend):

```bash
npm run dev
```

Expected behavior:

- Backend logs `Backend listening on ...` and a DB check result.
- Frontend serves from Vite (configured in `vite.config.js`).

### 5) Smoke test

```bash
curl -s http://localhost:3001/health
curl -s http://localhost:3001/temp/twoweeks
npm run demo:push
```

---

## Environment variables (`.env`) explained

Use `.env.example` as the template.

### Core app

- `PORT` - Express API port.
- `VITE_API_BASE` - Browser-visible API base URL used by frontend code.
- `API_URL` - Server-side/demo script target URL (`demo:push`).
- `HIVE_PASSKEY` - Upload passkey; must match `Hive.passkey` for your hive.

### Update timing / behavior

- `DEMO_PUSH_INTERVAL_MS` - interval for `npm run demo:push -- --loop` (default `10000`).
- `VITE_HOME_POLL_MS` - Home screen fallback poll interval in milliseconds (default `600000`, min `3000`).

### PostgreSQL

- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` - DB connection fields.
- `PGSSL` / `PGSSLMODE=require` - enable TLS for managed/cloud Postgres.

### Debug/testing

- `DEBUG_DB=1` - extra SQL logging from DB utility layer.
- `TEST_DB=1` - enable DB integration test blocks in backend tests.

---

## How updates work (important for demos)

The dashboard updates using a hybrid strategy:

1. **Immediate push signal:** Every successful upload triggers SSE on `/events/readings`.
2. **Debounced refresh:** Home screen coalesces burst events (small debounce window) and refetches.
3. **Fallback polling:** Home also polls in background using `VITE_HOME_POLL_MS`.
4. **Tab visibility catch-up:** Returning to an inactive tab can trigger a refresh.
5. **Snapshot cache:** Last successful Home/Alerts payloads are stored in `localStorage` for faster repeat loads.

Practical effect:

- If backend + network are healthy, new uploads usually appear quickly.
- Polling exists as a reliability fallback when SSE is unavailable/interrupted.

---

## Open-Meteo weather integration

The Home screen compares inside hive temperature against outside conditions using the Open-Meteo forecast API.

- Source: hourly `temperature_2m` from Open-Meteo
- Default location: Rochester, NY (RIT area coordinates)
- Timezone alignment: `America/New_York`
- Usage in UI:
  - powers the outside-temperature value on the Home hero section
  - powers the outside line in the 24-hour comparison chart
- Fallback behavior:
  - if weather data is missing/unavailable (or chart dates are outside forecast coverage), the app uses a synthetic outside-temperature estimate so charts remain readable and distinct

---

## API reference (project endpoints)

### Health / live update

- `GET /health`
- `GET /events/readings` (SSE stream)

### Temperature

- `GET /temp/measurement?datetime=<ISO>`
- `GET /temp/measurement/latest`
- `GET /temp/day?datetime=<ISO>`
- `GET /temp/week?datetime=<ISO>`
- `GET /temp/twoweeks`
- `GET /temp/range?start=<ISO>&end=<ISO>`

### Humidity

- `GET /Humidity/measurement?datetime=<ISO>`
- `GET /Humidity/measurement/latest`
- `GET /Humidity/day?datetime=<ISO>`
- `GET /Humidity/week?datetime=<ISO>`
- `GET /Humidity/twoweeks`
- `GET /Humidity/range?start=<ISO>&end=<ISO>`

### Upload

- `POST /upload/temp`
  - `{ "reading": number, "timestamp": ISO, "passkey": string }`
- `POST /upload/Humidity`
  - `{ "reading": number, "timestamp": ISO, "passkey": string }`
- `POST /uploadall/`
  - `{ "temp": number, "humidity": number, "timestamp": ISO, "passkey": string }`
  - also accepts TTN-like `uplink_message.decoded_payload`

Example:

```bash
curl -s -X POST http://localhost:3001/uploadall/ \
  -H "Content-Type: application/json" \
  -d '{"temp":72.5,"humidity":55,"timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"'","passkey":"seed-demo-key"}'
```

---

## NPM scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start Vite frontend dev server |
| `npm run dev:backend` | Start Express backend |
| `npm run build` | Build production frontend into `dist/` |
| `npm run preview` | Preview built frontend |
| `npm run start` | Start backend (same entry as dev backend) |
| `npm run db:setup` | Create Postgres role/database for local setup |
| `npm run db:seed` | Seed demo hive + sample readings |
| `npm run demo:push` | Push one (or looping) sample reading to upload endpoint |
| `npm test` | Run Jest tests |

---

## Testing

Run all configured tests:

```bash
npm test
```

Notes:

- Some bus-layer integration tests are gated behind `TEST_DB=1`.
- Without `TEST_DB=1`, only non-DB test paths run.

---

## Deploying to a school VM (Ubuntu)

High-level production sequence:

1. Install Node 20+, PostgreSQL, and optionally Nginx.
2. Clone repo and run `npm ci`.
3. Apply DB setup/schema/seed scripts.
4. Create production `.env` on the server (never commit secrets).
5. Run backend via `systemd` (or PM2 using `ecosystem.config.cjs` as a starting point).
6. Build frontend (`npm run build`) and serve `dist/` (Nginx or Express static).
7. Configure firewall and verify `/health`.

Minimum production env example:

```env
PORT=3001
PGHOST=localhost
PGPORT=5432
PGDATABASE=siteinfo
PGUSER=student
PGPASSWORD=<strong-password>
VITE_API_BASE=https://your-domain-or-host
API_URL=http://127.0.0.1:3001
HIVE_PASSKEY=<matches hive passkey>
```

---

## Troubleshooting

| Symptom | Check |
|---|---|
| UI cannot load readings | Backend running? `VITE_API_BASE` reachable from browser? |
| Upload says invalid passkey | `HIVE_PASSKEY` matches DB value for your hive (`hiveid=1` by default). |
| Port conflict on backend | Change `PORT` and update `VITE_API_BASE` / `API_URL` accordingly. |
| Postgres connection fails | Verify `PG*` vars and local Postgres role/database. |
| New readings not visible instantly | Confirm `/events/readings` reachable; fallback poll still updates eventually. |
| Mixed content in browser | HTTPS page cannot call HTTP API; align both to HTTPS in deployment. |

---

## Next steps (roadmap)

Planned production-oriented enhancements:

- **Email and SMS notifications**
  - Goal: deliver real alerts to beekeepers when thresholds are crossed or connectivity drops.
  - Current groundwork: alert generation already exists (`severity`, `type`, connectivity-gap detection, and notification-style filtering in UI).
- **Multi-hive support**
  - Goal: monitor multiple hives from one dashboard and switch/compare across locations.
  - Current groundwork: relational schema already models `Hive` plus `UserHives`, and API/data access patterns are organized around `hiveID`.
- **User accounts and hive-specific access**
  - Goal: each user logs in and sees only assigned hives with scoped preferences.
  - Current groundwork: schema includes `Users`, `UserHives`, and `Notify` tables, and backend includes authentication-related data-layer utilities that can be expanded into full auth flows.

These are the primary items to evolve the current capstone from a strong demo into a full multi-tenant product.

---

## License

Per course/team policy.
