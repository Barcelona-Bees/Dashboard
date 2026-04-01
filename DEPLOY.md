# Deploy (Docker + DigitalOcean + GitHub Actions)

This app uses one process serves the Vite `dist/` files and the Express API on the same host and port, so the browser uses **relative URLs** for `/temp/*`, `/Humidity/*`, and `/events/readings`. Build with `VITE_API_BASE` empty (see `Dockerfile` and CI).

## What is in the repo

- **`Dockerfile`** — multi-stage build (`npm run build` + `node src/backend/appLayer/al.js`).
- **`docker-compose.yml`** — optional local run with Postgres (you still need to load schema/data into `siteinfo` once).
- **`.github/workflows/ci.yml`** — on every PR/push to `main`: `npm ci`, `npm test`, `npm run build`.
- **`.github/workflows/docker-publish.yml`** — on push to `main`, builds the image and pushes to **GitHub Container Registry** (`ghcr.io/<owner>/<repo>:latest`).

## DigitalOcean (student credits)

Typical paths:

1. **Managed PostgreSQL** — create a cluster, note host, user, password, database name. Use SSL if required (you may need to extend `dbutils` / Pool options for `ssl: { rejectUnauthorized: false }` in production; check DO docs).
2. **App Platform** (simplest) — create an app from your GitHub repo **or** from the **container image** `ghcr.io/.../...:latest`. Set env vars: `NODE_ENV=production`, `PORT` (often `8080`), `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`. Run **one** web service using the Dockerfile.
3. **Droplet** — install Docker, `docker pull ghcr.io/...`, run with `-e` / `--env-file`, put Caddy or nginx in front for HTTPS on `:443` → app `:8080`.

## Database

The API expects your existing schema in the target database (see `src/backend/database/`). Run your initial SQL once against the production DB before relying on the dashboard.

## GitHub Container Registry

After the first successful **Docker** workflow on `main`, pull the image (when logged in to `ghcr.io`) or connect App Platform to the package. Repository packages may default to private; set package visibility or grant App Platform access per GitHub docs.

## Local Docker test

```bash
docker compose up --build
```

Then load schema into the `db` service and open `http://localhost:8080`.
