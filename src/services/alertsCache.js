/**
 * Last successful Alerts screen snapshot in localStorage (up to ~1 month).
 */
const CACHE_KEY = "bb_alerts_cache_v1";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** @returns {object | null} */
export function loadAlertsSnapshot() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o.savedAt !== "number") return null;
    if (Date.now() - o.savedAt > MAX_AGE_MS) return null;
    return o;
  } catch {
    return null;
  }
}

/** @param {object} payload */
export function saveAlertsSnapshot(payload) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...payload, savedAt: Date.now() })
    );
  } catch (e) {
    console.warn("Alerts cache save failed:", e);
  }
}
