# Beehive API — Minimal (No DB)

A tiny Express server with in-memory data to match your PWA. No Docker, no Postgres, no build step.

## Endpoints
- GET /health
- GET /sensors
- GET /alerts?open_only=true
- GET /readings?sensor_id=1&since=48h&limit=2000
- POST /ingest  (body: { sensor_id, ts_utc, temperature_c, ... })
- POST /alerts/{id}/ack

## Run
```bash
# Node 18+ recommended
node -v

npm install
npm start
# => http://localhost:8080
```

## Test quickly
```bash
curl http://localhost:8080/health
curl http://localhost:8080/sensors
curl "http://localhost:8080/readings?sensor_id=1&since=6h"
```

## Notes
- Data is **in-memory**; restarts reset it.
- Idempotency: duplicate (sensor_id, ts_utc) returns 409.
