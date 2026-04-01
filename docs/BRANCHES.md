# Branch split: site vs containerization

After syncing with `origin/main`, the repo uses two integration branches:

| Branch | Purpose | Contents |
|--------|---------|----------|
| **`containerization`** | Deploy + CI + Docker + GHCR | Same commit as **`optimizating-for-api-calls`** right after merging `main`: includes `Dockerfile`, `.github/workflows` (CI with GHCR push), `DEPLOY.md`, `docker-compose.yml`, static serving in `al.js`, `PGSSL` in `dbutils`, etc. |
| **`site-refinement`** | UX, polling, caching, alerts, no login | Same merge base **minus** deploy-only files (`Dockerfile`, `docker-compose`, `DEPLOY.md`, `.env.example`, `docker-publish.yml`). CI runs tests + build + Docker **build only** (no registry push). |

## Merge order (suggested)

1. Open a PR **`site-refinement` → `main`** (product changes, easier to review).
2. Then open a PR **`containerization` → `main`** (or merge `optimizating-for-api-calls` if it matches `containerization`) for deploy plumbing.

Alternatively merge **`containerization`** first if you need production Docker before UI lands — expect possible small conflicts in `al.js` / `api.js`.

## Syncing with `main` again later

```bash
git fetch origin
git checkout site-refinement   # or containerization
git merge origin/main
# resolve conflicts, test, push
```
