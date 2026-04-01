# Deploy (Docker + DigitalOcean + GitHub Actions)

This app uses **Plan A**: Express serves the Vite `dist/` files and the API on the same host and port, so the browser uses **relative URLs** for `/temp/*`, `/Humidity/*`, and `/events/readings`. Build with `VITE_API_BASE` empty (see `Dockerfile` and CI).

## Working on a feature branch (without touching main)

This is the safe default when production tracks `main` / `master`.

1. **Create or stay on your branch** (example: `optimizating-for-api-calls`):
   ```bash
   git checkout -b your-branch-name
   # or: git checkout optimizating-for-api-calls
   ```

2. **Commit and push only that branch** to GitHub:
   ```bash
   git add -A
   git commit -m "Describe your change"
   git push -u origin your-branch-name
   ```

3. **CI runs automatically** (`.github/workflows/ci.yml`):
   - `npm ci` → `npm test` → `npm run build` (with `VITE_API_BASE=""`)
   - **Docker build with no push** — proves the image builds; it does **not** update any registry image.

4. **What does *not* run on your branch**
   - **`docker-publish.yml`** only runs on pushes to **`main`** or **`master`**. Pushing your feature branch will **not** overwrite `ghcr.io/.../...:latest`, so production stays safe.

5. **When you are ready to deploy**
   - Open a **Pull Request** into `main` (or `master`), get review, merge.
   - **After merge**, GitHub runs **Docker publish** and pushes `:latest` (if that is what production pulls).
   - If DigitalOcean watches **main** and auto-deploys, the deploy happens **after** merge, not from your feature branch alone.

6. **Optional: deploy a branch to a staging app**  
   Point a second DO App Platform service at a **branch-specific** image tag (you would add a workflow that pushes `ghcr.io/.../...:branch-name` only — not set up by default). For class projects, **PR + merge to main** is usually enough.

## What is in the repo

- **`Dockerfile`** — multi-stage build (`npm run build` + `node src/backend/appLayer/al.js`).
- **`docker-compose.yml`** — optional local run with Postgres (load schema into `siteinfo` once).
- **`.github/workflows/ci.yml`** — on **every** push and **every** PR: tests, Vite build, **Docker build (no push)**.
- **`.github/workflows/docker-publish.yml`** — **only** on push to **`main`/`master`**: build and push `ghcr.io/<owner>/<repo>:latest`.

## DigitalOcean (student credits)

1. **Managed PostgreSQL** — note host, user, password, database. You may need `ssl` on the Pool for managed DBs (ask if connection fails).
2. **App Platform** — deploy from GitHub **or** from image `ghcr.io/.../...:latest`. Set `NODE_ENV=production`, `PORT` (e.g. `8080`), `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.
3. **Droplet** — Docker + `docker pull` + reverse proxy for HTTPS.

## Database

Apply your schema from `src/backend/database/` to the target DB once before relying on the app.

## GitHub Container Registry

After **Docker publish** succeeds on **main**, use the image URL shown in the Actions log. Packages may be private; adjust visibility or App Platform access in GitHub settings.

## Local Docker test

```bash
docker compose up --build
```

Then load schema into the `db` service and open `http://localhost:8080`.
