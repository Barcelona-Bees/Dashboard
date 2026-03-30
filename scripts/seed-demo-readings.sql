-- Demo temperature + humidity for hive 1. Run as superuser:
--   npm run db:seed
--
-- Requires tables from src/backend/database/database_initial.sql applied to siteinfo.

INSERT INTO hive (hiveid, name, zipcode, passkey, startdate)
SELECT
  1,
  'Demo Hive',
  '14623',
  'seed-demo-key',
  CURRENT_TIMESTAMP - INTERVAL '400 days'
WHERE NOT EXISTS (SELECT 1 FROM hive WHERE hiveid = 1);

INSERT INTO temperature (hiveid, timestamp, reading)
SELECT
  1,
  g,
  (68 + random() * 8)::double precision
FROM generate_series(
  date_trunc('hour', NOW() - INTERVAL '10 days'),
  date_trunc('hour', NOW()),
  INTERVAL '1 hour'
) AS g
WHERE NOT EXISTS (SELECT 1 FROM temperature WHERE hiveid = 1);

INSERT INTO humidity (hiveid, timestamp, reading)
SELECT
  1,
  g,
  (45 + random() * 25)::double precision
FROM generate_series(
  date_trunc('hour', NOW() - INTERVAL '10 days'),
  date_trunc('hour', NOW()),
  INTERVAL '2 hours'
) AS g
WHERE NOT EXISTS (SELECT 1 FROM humidity WHERE hiveid = 1);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO student;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO student;
