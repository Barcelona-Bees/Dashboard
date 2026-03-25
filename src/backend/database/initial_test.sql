INSERT INTO users (username, password, email, phone, datastartdate)
VALUES
  ('admin', 'admin', 'admin@admin.com', '5555555555', '2026-03-01T00:00:00Z');

INSERT INTO hive (name, zipcode, startdate, passkey)
VALUES
  ('Barcelona Hive 1', '14623', '2026-03-01T00:00:00Z', 'local-dev-passkey');

INSERT INTO userhives (userid, hiveid)
VALUES
  (1, 1);

INSERT INTO notify (userid, notiftype, temp, humidity, carbondioxide, swarm)
VALUES
  (1, 'both', TRUE, TRUE, TRUE, FALSE);

WITH series AS (
  SELECT generate_series(
    TIMESTAMPTZ '2026-03-01T00:00:00Z',
    TIMESTAMPTZ '2026-03-14T23:50:00Z',
    INTERVAL '10 minutes'
  ) AS ts
)
INSERT INTO temperature (hiveid, timestamp, reading)
SELECT
  1,
  ts,
  ROUND((18 + SIN(EXTRACT(EPOCH FROM ts) / 86400) * 4)::numeric, 2)
FROM series;

WITH series AS (
  SELECT generate_series(
    TIMESTAMPTZ '2026-03-01T00:00:00Z',
    TIMESTAMPTZ '2026-03-14T23:50:00Z',
    INTERVAL '10 minutes'
  ) AS ts
)
INSERT INTO humidity (hiveid, timestamp, reading)
SELECT
  1,
  ts,
  ROUND((55 + SIN(EXTRACT(EPOCH FROM ts) / 43200) * 8)::numeric, 2)
FROM series;
