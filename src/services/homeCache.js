/**
 * Last successful Home screen payload in localStorage so repeat visits avoid a blank load
 * while the API catches up. Not IndexedDB — keeps the surface area small.
 */
const CACHE_KEY = "bb_home_cache_v1";

/** @returns {object | null} Snapshot for hydrating HomeScreen. */
export function loadHomeSnapshot() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o.savedAt !== "number") return null;
    if (Date.now() - o.savedAt > 14 * 24 * 60 * 60 * 1000) return null;
    return o;
  } catch {
    return null;
  }
}

/** @param {object} payload */
export function saveHomeSnapshot(payload) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...payload, savedAt: Date.now() })
    );
  } catch (e) {
    console.warn("Home cache save failed:", e);
  }
}

export function clearHomeSnapshot() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
