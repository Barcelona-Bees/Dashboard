# PR summary — Live backend integration & ops (Barcelona Bees)

Use this document as the narrative for your pull request and onboarding. It explains **what changed**, **why**, and **why it should not break** existing lab/team setups.

---

## Goals (what problem this solves)

1. **Replace mock data** with real HTTP calls to the Express API (`src/backend/appLayer/al.js`).
2. **Align** frontend models with backend JSON (`measurement.rows` from `pg`).
3. **Work on real machines**: configurable Postgres credentials, fewer “silent” failures, seed scripts for demos.
4. **Operational clarity**: DB check on startup, README + scripts for Ubuntu/VM deploy, `demo:push` to simulate sensors.

---

## Why this should **not** break existing behavior

| Area | Backward compatibility |
|------|------------------------|
| **Postgres** | If `.env` is missing, `dbutils.js` still defaults to `student` / `student` / `siteinfo` / `localhost:5432` (same as original hardcoded pool). |
| **API paths** | Frontend uses the same routes the server already exposed: `/temp/twoweeks`, `/Humidity/twoweeks`, uploads `POST /uploadall/`, etc. No rename of existing handlers. |
| **Express** | New code paths are additive: startup check, safer `getHiveStartDate`. Routes unchanged. |
| **UI** | When the DB has **no rows**, the UI shows an **empty state** instead of throwing (previously looked like “server down”). When the server truly fails, error text is clearer. |

**Regression risk to watch:** If someone relied on **throwing** when data is empty (unlikely), behavior changed: `getCurrentReading()` now returns `null`.

---

## File-by-file (high level)

### Frontend — API & transforms

| File | Change |
|------|--------|
| `src/services/api.js` | Correct paths (`/temp/...`, `/Humidity/...`), merge temp+humidity rows, `getReadings`, `getCurrentReading` returns `null` if empty, better errors for non-OK HTTP, `temperatureF` (°F from DB). |
| `src/services/dataTransform.js` | No fake CO₂/battery; °F passthrough; chart transforms use `temperatureF`. |
| `src/services/alerts.js` | Skip humidity/CO₂ rules when values are `null`. |
| `src/utils/conversions.js` | `celsiusToFahrenheit` kept for **Open-Meteo weather only** (still °C from API). |
| `src/screens/HomeScreen.jsx` | Fetches real data; empty state vs error; gauges handle missing humidity/CO₂; **poll every 5 minutes** (comment in file). |
| `src/screens/AlertsScreen.jsx` | Empty state when no readings. |
| `src/screens/DataScreen.jsx` | Real series; removed fake volume/CO₂ charts; clearer fetch errors. |
| `src/screens/AccountScreen.jsx` | Loads summary from API; handles `null` reading. |

### Backend — DB & app layer

| File | Change |
|------|--------|
| `src/backend/dataLinkLayer/dbutils.js` | `dotenv` load from repo `.env`; `Pool` from `PG*` env; `verifyDatabaseConnection()`; file header explains `??` password behavior. |
| `src/backend/appLayer/al.js` | Import `verifyDatabaseConnection`; **exit 1** if DB unreachable before `listen`; `getHiveStartDate` handles future `startDate` + column casing; stderr hints for `npm run db:setup`. |

### Removed / scripts

| Item | Change |
|------|--------|
| `src/data/fake.js` | **Deleted** — was the mock readings source. |
| `scripts/setup-postgres.sql` | Creates `student` + `siteinfo` idempotently where possible. |
| `scripts/seed-demo-readings.sql` | Hive 1 + demo temp/humidity + `GRANT` for `student`. |
| `scripts/send-sample-reading.mjs` | `npm run demo:push` → `POST /uploadall/`. |

### Config / deps / docs

| File | Change |
|------|--------|
| `package.json` | `dotenv`; `rollup` + optional darwin native deps for Vite on Apple Silicon; scripts: `db:setup`, `db:seed`, `demo:push`. |
| `.env.example` | Documents `VITE_API_BASE`, `PG*`, `API_URL`, `HIVE_PASSKEY`. |
| `README.md` | Local + VM deploy, API table, troubleshooting, team-oriented. |

---

## Data flow (end-to-end)

1. **Sensor path (simulated):** `npm run demo:push` → `POST /uploadall/` → `insertTemp` / `insertHumidity` → Postgres.
2. **Dashboard path:** Browser → `fetch(VITE_API_BASE + '/temp/twoweeks')` → Express → `getCustomRangeTemperature` → `{ measurement: { rows } }` → merged with humidity → charts/KPIs.

---

## Testing checklist (for reviewers)

- [ ] `npm run dev:backend` prints `[db] OK` and listens on 3001.
- [ ] `npm run dev` loads UI; after login, home loads or shows empty state (not fake error) if DB empty.
- [ ] `npm run demo:push` returns HTTP 200 and new row appears after refresh (or within 5 min auto-refresh on home).
- [ ] `curl` to `/temp/twoweeks` returns JSON with `measurement`.

---

## Known limitations (document for capstone)

- Hive ID is fixed server-side (`DEFAULT_HIVE_ID = 1`); `getReadings(hiveId)` reserves the parameter for a future query string.
- Nginx example in README is **illustrative**—you must proxy **all** API path prefixes (`/temp`, `/Humidity`, `/upload`) or expose port 3001 directly with `VITE_API_BASE` pointing at it.
