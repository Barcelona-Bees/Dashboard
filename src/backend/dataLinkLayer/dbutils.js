import pg from "pg";

const { Pool } = pg;

let pool;

function getConfig() {
  return {
    host: process.env.PGHOST ?? "127.0.0.1",
    port: Number(process.env.PGPORT ?? 5432),
    database: process.env.PGDATABASE ?? "barcelona_bees",
    user: process.env.PGUSER ?? "postgres",
    password: process.env.PGPASSWORD ?? "postgres",
  };
}

export function getPool() {
  if (!pool) {
    pool = new Pool(getConfig());
  }

  return pool;
}

export async function query(text, params = []) {
  return getPool().query(text, params);
}

export async function pingDatabase() {
  await query("SELECT 1");
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
