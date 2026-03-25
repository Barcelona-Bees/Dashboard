# Barcelona Bees Dashboard

This repo contains:

- A Vite + React frontend at `src/`
- A minimal Express + PostgreSQL backend at `src/backend/`

## Local setup

1. Copy the example env file:

```bash
cp .env.example .env
```

2. Create the database:

```bash
createdb barcelona_bees
psql -d barcelona_bees -f src/backend/database/database_initial.sql
psql -d barcelona_bees -f src/backend/database/initial_test.sql
```

3. Install dependencies if needed:

```bash
npm install
```

4. Run backend and frontend together:

```bash
npm run dev:full
```

Or run them separately:

```bash
npm run dev:backend
npm run dev
```

Frontend: [http://localhost:5173](http://localhost:5173)

Backend health check: [http://localhost:3001/health](http://localhost:3001/health)

## Current state

- Login is still a frontend-only placeholder.
- Alerts and several dashboard values still use synthetic or derived data.
- The backend currently serves temperature and humidity history for a single hive workflow.
