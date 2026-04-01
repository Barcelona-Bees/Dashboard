-- One-time local setup (creates role `student`, database `siteinfo`).
--
-- psql defaults to your macOS username as the DB role. If you see
--   FATAL: role "YourName" does not exist
-- connect explicitly as the built-in superuser:
--   npm run db:setup
--   (same as: psql -U postgres -d postgres -f scripts/setup-postgres.sql)
--
-- If `postgres` also does not exist, your cluster has no default superuser.
-- Fix the install (Homebrew: brew info postgresql) or use Postgres.app and
-- create a superuser from its UI, then run this file again.
--
-- Idempotent: role + database (safe to run multiple times).
DO $$
BEGIN
  CREATE ROLE student WITH LOGIN PASSWORD 'student';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- CREATE DATABASE has no IF NOT EXISTS in older Postgres; use psql \gexec so re-runs don't error.
SELECT format('CREATE DATABASE %I OWNER student', 'siteinfo')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'siteinfo');
\gexec

-- If siteinfo already existed with another owner, hand it to student for the app.
ALTER DATABASE siteinfo OWNER TO student;
