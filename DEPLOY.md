# Full deployment runbook: GitHub (GHCR) → DigitalOcean (Postgres + App Platform)

Use this document when you deploy later. Nothing here requires you to merge to `main` unless you want to.

---

## 0. What you are building (one sentence)

One **Docker image** lives on **GitHub Container Registry** (`ghcr.io`). **DigitalOcean App Platform** pulls that image, runs it on port **8080**, and connects it to **DigitalOcean Managed PostgreSQL** using environment variables.

---

## 1. Information to gather before you start

Write these down as you go (Notepad / Notes app).

| Item | Where you get it | Example |
|------|------------------|---------|
| **GitHub username or org** | Top-right on GitHub | `connorbashaw` |
| **Repo name** | Repo URL | `Dashboard` → often lowercased for image |
| **Full image name** | See §2 | `ghcr.io/connorbashaw/dashboard:latest` |
| **DB host** | DO database → Connection | `db-postgresql-nyc3-12345.db.ondigitalocean.com` |
| **DB port** | Same screen | Usually **`25060`** (not 5432) |
| **DB user** | Same screen | Often `doadmin` or custom |
| **DB password** | Same screen (save once) | (secret) |
| **Database name** | Same screen | Often `defaultdb` or team DB name |

**Image name rule (must be lowercase):**

```text
ghcr.io/<github-owner-lowercase>/<repo-name-lowercase>:latest
```

Example: owner `MyTeam`, repo `Dashboard` → `ghcr.io/myteam/dashboard:latest`

---

## 2. Part A — Publish the Docker image to GHCR (GitHub)

### 2.1 Push your latest code

Commit everything you want in the image and push your branch to GitHub.

### 2.2 Run the “Docker publish” workflow

1. Open your repo on **GitHub** in a browser.
2. Click the **Actions** tab (top menu).
3. In the left sidebar, click **Docker publish** (under “All workflows”).
4. Click **Run workflow** (right side, gray button).
5. **Use workflow from**: choose **Branch** → select the branch that has your `Dockerfile` (e.g. `optimizating-for-api-calls` or `main`).
6. Click the green **Run workflow** button.
7. Wait for the workflow to finish (green check). If it fails, open the run → read the red step (often npm or Docker).

### 2.3 Confirm the image exists

1. GitHub → your **profile picture** (top right) → **Your profile** (or open `https://github.com/<you>?tab=packages`).
2. Click **Packages** (or go to **Repositories** → your repo → right column **Packages**).
3. You should see a package named like your repo (e.g. `dashboard`). Open it.
4. Copy the **full image URL** shown (often `ghcr.io/owner/repo:latest`). That is what you paste into DigitalOcean.

### 2.4 Public vs private image (choose one)

**Option A — Public package (simplest for class projects)**

1. Open the package → **Package settings** (gear).
2. **Change package visibility** → **Public** → confirm.

**Option B — Private package (use a PAT in DigitalOcean)**

1. GitHub → **Settings** (your user profile, not repo) → **Developer settings** (bottom left).
2. **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
3. Name: `digitalocean-ghcr-read`.
4. Expiration: your choice (e.g. 90 days).
5. Scopes: enable **`read:packages`** (and **`write:packages`** only if you push images manually with this token).
6. **Generate token** → **copy the token once** (you cannot see it again).

You will use:

- **Registry username** = your **GitHub username** (exact).
- **Registry password** = the **PAT** (not your GitHub password).

---

## 3. Part B — Create PostgreSQL on DigitalOcean

1. Log in: **https://cloud.digitalocean.com**
2. Left sidebar → **Databases** (or **Create** → **Databases**).
3. **Create Database** → choose **PostgreSQL**.
4. **Choose a cluster configuration**: pick the **cheapest** / smallest (enough for demos).
5. **Choose a datacenter region** (same region as your app later, if possible).
6. **Choose a unique database cluster name** (any label).
7. Click **Create a Database Cluster** and wait until status is **Ready** (minutes).

### 3.1 Trusted sources (so the app can connect)

1. Open your **database cluster** → **Settings** (or **Network**).
2. Find **Trusted sources** / **Firewall**.
3. Add:
   - **App Platform** as a trusted source if there is a button for it, **or**
   - For troubleshooting only: **Allow all** / **0.0.0.0/0** (less secure; only if you must debug).

### 3.2 Copy connection parameters

1. Open cluster **Overview** or **Connection details**.
2. **Connection parameters** (or “Connection string”):

   You need these **five** values for env vars:

   | Your note | Env var |
   |-----------|---------|
   | Host (hostname only) | `PGHOST` |
   | Port (often `25060`) | `PGPORT` |
   | User | `PGUSER` |
   | Password | `PGPASSWORD` |
   | Database name | `PGDATABASE` |

3. If the password was shown once, **save it** now.

**SSL:** Managed Postgres requires TLS. The app uses **`PGSSL=true`** (already implemented in code).

---

## 4. Part C — Create App Platform (container from GHCR)

### 4.1 Start the app wizard

1. **Create** (green, top right) → **Apps** → **Create App**.
2. On **Choose resources**, select **Docker Hub** / **Container registry** / **Container image** (wording varies).
3. Choose **Container image** as the source type (not “GitHub” if you’re using GHCR).

### 4.2 Registry and image

**If DigitalOcean shows “GitHub Container Registry” as a preset:**

- Connect or authorize if asked.
- **Image**: `owner/repo` (or full `ghcr.io/owner/repo:latest` — follow the field labels).

**If it asks for a generic container registry:**

- **Registry server / URL**: `ghcr.io`
- **Registry username**: your **GitHub username**
- **Registry password**:
  - If **public** image: **sometimes** leave blank or use **anonymous** (if DO allows).
  - If **private** image: paste the **PAT** from §2.4.
- **Image**: `owner/repo` **or** full `ghcr.io/owner/repo:latest` (match what DO’s form asks for — usually **repository** + **tag** `latest`).

**Double-check:** Image name segments must be **LOWERCASE** (same as `ghcr.io` URL from GitHub Packages).

### 4.3 Resource plan

- Pick the **smallest** Web Service / instance size for your class budget.

### 4.4 HTTP port (critical)

- **HTTP Port** / **Public HTTP port** / **Internal port**: set to **`8080`**.
  - The `Dockerfile` sets `EXPOSE 8080` and `ENV PORT=8080`.

### 4.5 Health check (recommended)

- **Health check type**: HTTP (if available).
- **HTTP path**: `/health`
- **Port**: `8080`
- The app responds with `{"ok":true}` (no database call on that route).

### 4.6 Environment variables (exact list)

Add these in the **App** or **Web Service** component → **Settings** → **Environment Variables** (or during the wizard).

| Key | Value | Notes |
|-----|--------|--------|
| `NODE_ENV` | `production` | Required for serving `dist/` + API together |
| `PORT` | `8080` | Must match container |
| `PGHOST` | *(paste host only)* | No `https://`, no `postgres://` |
| `PGPORT` | `25060` | Use DO’s **exact** port from connection screen |
| `PGUSER` | *(paste)* | |
| `PGPASSWORD` | *(paste)* | Treat as secret |
| `PGDATABASE` | *(paste)* | |
| `PGSSL` | `true` | Required for DigitalOcean managed Postgres |

**Do not set:**

- `SERVE_STATIC=0` (you need the UI).
- `VITE_*` at runtime — the **build** already baked in `VITE_API_BASE` in the Docker image.

Mark **`PGPASSWORD`** as **SECRET / ENCRYPTED** if DigitalOcean offers that option.

### 4.7 Deploy

1. **Review** → **Create resources** / **Launch** / **Deploy**.
2. Wait until the **Deploy** finishes (can take several minutes).
3. Copy the **App URL** (e.g. `https://something.ondigitalocean.app`).

---

## 5. Part D — Load database schema (one-time)

The API expects tables (hive, temperature, humidity, etc.). Without this, the app may start but **no data** or **500 errors**.

1. **DigitalOcean** → **Databases** → your cluster.
2. **Users & Databases** / **SQL** / **Console**:
   - Use the **Query** / **Console** UI (runs SQL in the browser), **or**
   - Use **Connection details** → `psql` from your laptop with SSL (see DO’s docs for the exact `psql` flags).

3. Run your team’s schema SQL from the repo, for example:

   - `src/backend/database/database_initial.sql` (or whatever your project uses).

4. **Same database name** as `PGDATABASE` in App Platform.

5. Optionally run seed data if your team uses it (`scripts/seed-demo-readings.sql` only if it matches your schema).

---

## 6. Part E — Verify after deploy

1. **Browser:** open `https://<your-app>.ondigitalocean.app/`
   - You should see the dashboard (not a blank page).
2. **Health:** open `https://<your-app>.ondigitalocean.app/health`
   - JSON: `{"ok":true}`.
3. **Browser DevTools** → **Network** tab → reload:
   - Requests to `/temp/...`, `/Humidity/...` should use the **same host** as the page (no `localhost:3001`).

---

## 7. Troubleshooting quick reference

| Problem | What to check |
|---------|----------------|
| **Deploy fails: image pull** | Image name `ghcr.io/owner/repo:latest` all **lowercase**; private registry needs **username + PAT**; PAT has **`read:packages`**. |
| **Crash loop / logs: DB connection** | `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`; **`PGSSL=true`**; **Trusted sources** allow App Platform. |
| **502 / timeout** | App listening on **8080**; health check path **`/health`**. |
| **UI loads but no data** | Schema not applied; wrong DB name; seed not run. |
| **CORS errors** | Wrong image build — rebuild with `VITE_API_BASE` empty (your `Dockerfile` CI already does this). |

---

## 8. After you change code (redeploy)

1. Push to GitHub → run **Docker publish** (workflow) again → new `:latest`.
2. **App Platform** → your app → **Deploy** / **Force rebuild** (or enable auto-deploy if you configure it).

---

## 9. Local Docker (optional sanity check)

```bash
docker compose up --build
```

Apply schema to the local `db` container, then open `http://localhost:8080`.

---

## 10. Copy-paste checklist (print this)

- [ ] Docker publish workflow **green** on GitHub  
- [ ] GHCR image URL copied (`ghcr.io/.../...:latest`)  
- [ ] Package **public** or **PAT** ready  
- [ ] DO Postgres **Ready** and **Trusted sources** OK  
- [ ] `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` written down  
- [ ] App Platform **port 8080**, **health `/health`**, env vars **`NODE_ENV`**, **`PORT`**, **`PGSSL=true`**  
- [ ] Schema SQL executed on **that** database  
- [ ] `/` and `/health` work in browser  
