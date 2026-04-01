# Branch strategy (site first, Docker later)

## Current focus: **`site-refinement`**

All **UI/UX, performance, caching, alerts, and open access** work happens here. This branch **does not** include Dockerfiles, GHCR publish, or `DEPLOY.md` — so you can ship a polished app to your VM without thinking about images.

**Day-to-day:**

```bash
git checkout site-refinement
git pull origin site-refinement
```

Merge to **`main`** when the product is ready for your class / live demo (separate from any Docker roadmap).

---

## Deferred: **`containerization`**

Docker, `docker-compose`, GitHub Actions image push to GHCR, and production static+API-in-one-container live on the **`containerization`** branch (same tip as **`optimizating-for-api-calls`** at the merge commit). **Pick this up later** when you are ready to containerize — nothing here blocks the refined site.

To return to that work later:

```bash
git fetch origin
git checkout containerization
# or: git checkout optimizating-for-api-calls  # same deploy stack as containerization at merge
```

---

## Summary

| Branch | When to use |
|--------|-------------|
| **`site-refinement`** | **Now** — refine the live site, finalize behavior, then PR → `main`. |
| **`containerization`** | **Later** — images, registry, DigitalOcean from Dockerfile, etc. |

## Syncing either branch with updated `main`

```bash
git fetch origin
git checkout site-refinement   # or containerization
git merge origin/main
# resolve conflicts, npm test, push
```
