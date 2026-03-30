# Barcelona Bees — Hive monitoring dashboard

Single-page **React (Vite)** dashboard plus **Express** API and **PostgreSQL** for the capstone: sensor readings → Postgres → UI (current metrics, charts, alerts).


---

## Stack

- **Frontend:** React 18, Vite 7 (`npm run dev` / `npm run build`)
- **Backend:** Node.js 20+ + Express (`src/backend/appLayer/al.js`)
- **Database:** PostgreSQL (schema: `src/backend/database/database_initial.sql`)

---

## Team onboarding checklist

1. **Clone & install**
   ```bash
   git clone <repo-url> && cd Dashboard
   npm install
   cp .env.example .env
   ```
2. **Edit `.env`** — at minimum `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `VITE_API_BASE=http://localhost:3001`, `HIVE_PASSKEY` (must match `Hive.passkey` in DB), `API_URL=http://localhost:3001`.
3. **Postgres** — `npm run db:setup` (creates role+DB), then apply schema + seed:
   ```bash
   psql -U postgres -d siteinfo -f src/backend/database/database_initial.sql
   npm run db:seed
   ```
4. **Run two terminals** — `npm run dev:backend` then `npm run dev` → open the Vite URL and log in (local toggle).
5. **Verify** — `curl -s http://localhost:3001/temp/twoweeks` should return JSON with `measurement`. Optional: `npm run demo:push` then refresh the browser.

---

## Quick start (local)

### 1. Install

```bash
npm install
cp .env.example .env
```

### 2. PostgreSQL

```bash
npm run db:setup
psql -U postgres -d siteinfo -f src/backend/database/database_initial.sql
npm run db:seed
```

`db:seed` sets hive `1` passkey to **`seed-demo-key`** — must match **`HIVE_PASSKEY`** in `.env` for uploads.

### 3. Run API + UI

**Terminal A — backend (port 3001):**

```bash
npm run dev:backend
```

Expect: `[db] OK` and `Backend listening on http://localhost:3001`.

**Terminal B — frontend (port 5173):**

```bash
npm run dev
```

Open the printed URL. **Set `VITE_API_BASE`** to wherever the API is reachable from the browser (same machine: `http://localhost:3001`).

### 4. Live test data (`demo:push`)

**One shot:**

```bash
npm run demo:push
```

**Loop every 10 seconds** (change `DEMO_PUSH_INTERVAL_MS` in `.env` to slow down):

```bash
npm run demo:push -- --loop
```

**Important — timing:**

| Mechanism | Default interval |
|-----------|------------------|
| `demo:push --loop` | **10 seconds** (`DEMO_PUSH_INTERVAL_MS`, default `10000`) |
| Home screen auto-refresh | **5 minutes** (`setInterval` in `HomeScreen.jsx`) |

So new DB rows appear immediately after `demo:push`, but the **home page** only auto-pulls every **5 minutes** unless you **refresh the tab** (or wait for the interval).

---

## Upload API (hardware / scripts)

| Method | Path | Body (JSON) |
|--------|------|-------------|
| `POST` | `/upload/temp` | `{ "reading": number, "timestamp": ISO string, "passkey": string }` |
| `POST` | `/upload/Humidity` | `{ "reading": number, "timestamp": ISO string, "passkey": string }` |
| `POST` | `/uploadall/` | `{ "temp": number, "humidity": number, "timestamp": ISO string, "passkey": string }` |

`passkey` must match `Hive.passkey` in Postgres.

**curl example:**

```bash
curl -s -X POST http://localhost:3001/uploadall/ \
  -H "Content-Type: application/json" \
  -d '{"temp":72.5,"humidity":55,"timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"'","passkey":"seed-demo-key"}'
```

---

## Deploying on a school VM (Ubuntu 22.04, e.g. RIT WebDev / RLES)

Assumptions: one VM, **Node 20+**, **PostgreSQL**, and you are allowed to open HTTP/HTTPS (and optionally port **3001** for the API).

### 1. Packages

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib nginx
```

Install Node **20 LTS** ([NodeSource](https://github.com/nodesource/distributions) or `nvm`).

### 2. Deploy code

```bash
sudo mkdir -p /var/www && sudo chown "$USER":"$USER" /var/www
cd /var/www
git clone <repo-url> barcelona-bees && cd barcelona-bees
npm ci
```

### 3. Database

```bash
sudo -u postgres psql -f scripts/setup-postgres.sql
sudo -u postgres psql -d siteinfo -f src/backend/database/database_initial.sql
sudo -u postgres psql -d siteinfo -f scripts/seed-demo-readings.sql
```

### 4. Production `.env` (on the server, not in git)

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=siteinfo
PGUSER=student
PGPASSWORD=<strong-password>
PORT=3001
```

**Frontend build-time URL** — set **before** `npm run build`:

```env
# Use the URL the browser will use to reach the API (include port if not behind nginx).
VITE_API_BASE=http://YOUR_VM_HOSTNAME:3001
```

**Scripts / server-side only:**

```env
API_URL=http://127.0.0.1:3001
HIVE_PASSKEY=<same as Hive.passkey>
```

### 5. Backend (systemd)

Create `/etc/systemd/system/barcbees-api.service` (adjust `User`, paths, and use `which node` on the VM for `ExecStart`):

```ini
[Unit]
Description=Barcelona Bees Express API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/barcelona-bees
EnvironmentFile=/var/www/barcelona-bees/.env
ExecStart=/usr/bin/node src/backend/appLayer/al.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

If `node` is not at `/usr/bin/node`, run `which node` and substitute that path.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now barcbees-api
sudo systemctl status barcbees-api
```

### 6. Frontend build

```bash
cd /var/www/barcelona-bees
npm run build
```

Output: `dist/`.

### 7. Nginx — two practical options

**Option A (simplest):** Serve static files from Nginx on port 80/443; **open firewall port 3001** for the API. Set `VITE_API_BASE=http://YOUR_VM:3001` before `npm run build`. CORS in `al.js` is permissive (`*`) for dev; tighten for production if required.

**Option B:** Reverse-proxy **all** Express routes to Node. The API uses paths starting with `/temp`, `/Humidity`, and `/upload` (including `/uploadall/`). Example:

```nginx
server {
    listen 80;
    server_name your-vm.example.edu;
    root /var/www/barcelona-bees/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location ~ ^/(temp|Humidity|upload) {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then set `VITE_API_BASE` to **empty string** or the **same origin** as the site (e.g. `http://your-vm.example.edu`) **only if** the proxy preserves path prefixes 1:1. If in doubt, use **Option A**.

### 8. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
# If using Option A for API:
sudo ufw allow 3001/tcp
sudo ufw enable
```

### 9. Health checks

```bash
curl -s http://127.0.0.1:3001/temp/twoweeks
npm run demo:push
```

---

## Scripts reference

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server |
| `npm run dev:backend` | Express API |
| `npm run build` | Production `dist/` |
| `npm run db:setup` | Create Postgres role + `siteinfo` |
| `npm run db:seed` | Demo hive + readings + grants |
| `npm run demo:push` | POST one sample reading to `/uploadall/` |

---

## Troubleshooting

| Symptom | What to check |
|--------|----------------|
| UI “Error” / cannot load | Backend running? `VITE_API_BASE` reachable from browser (HTTPS page cannot call `http://` API — mixed content). |
| `Invalid passkey` | `HIVE_PASSKEY` equals `SELECT passkey FROM hive WHERE hiveid = 1;` |
| Port 3001 in use | `lsof -i :3001` → kill old process, or `PORT=3002` + update `VITE_API_BASE` / `API_URL`. |
| Postgres errors | `PG*` in `.env`, Postgres listening, `scripts/setup-postgres.sql` ran. |
| No new numbers on home | Home auto-refreshes every **5 min**; **refresh the page** after `demo:push`, or wait. |

---

## License / course use

Per your institution and team policy.
