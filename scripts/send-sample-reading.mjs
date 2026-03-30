#!/usr/bin/env node
/**
 * POSTs a random temperature + humidity reading — same contract as POST /uploadall/ in al.js.
 * passkey must match Hive.passkey (see HIVE_PASSKEY in .env; seed uses seed-demo-key).
 *
 * Timing vs the dashboard:
 * - `demo:push --loop` default interval = 10 seconds (override with DEMO_PUSH_INTERVAL_MS in .env).
 * - HomeScreen auto-refreshes from the API every 5 minutes, OR you can refresh the browser manually
 *   to see new points immediately after a push. (If you expected “every 10 minutes”, that is the home
 *   poll—not this script.)
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const API_URL = (process.env.API_URL || "http://localhost:3001").replace(/\/$/, "");
const PASSKEY = process.env.HIVE_PASSKEY || "seed-demo-key";
const INTERVAL_MS = Number(process.env.DEMO_PUSH_INTERVAL_MS || 10_000);

async function pushOnce() {
  const temp = Math.round((70 + Math.random() * 8) * 10) / 10;
  const humidity = Math.round((45 + Math.random() * 20) * 10) / 10;
  const timestamp = new Date().toISOString();

  const res = await fetch(`${API_URL}/uploadall/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      temp,
      humidity,
      timestamp,
      passkey: PASSKEY,
    }),
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  const line = `[${new Date().toISOString()}] POST /uploadall/ → ${res.status} ${typeof body === "object" ? JSON.stringify(body) : body}`;
  if (!res.ok) {
    console.error(line);
    if (res.status === 400) {
      console.error(
        "Hint: HIVE_PASSKEY must match the passkey column for hive 1 (see Hive table or .env)."
      );
    }
  } else {
    console.log(line, `→ temp=${temp}°F hum=${humidity}%`);
  }
}

const loop = process.argv.includes("--loop");

if (loop) {
  console.log(
    `Pushing every ${INTERVAL_MS}ms to ${API_URL}/uploadall/ (passkey from HIVE_PASSKEY)`
  );
  await pushOnce();
  setInterval(pushOnce, INTERVAL_MS);
} else {
  await pushOnce();
}
