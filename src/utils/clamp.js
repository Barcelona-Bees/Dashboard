/**
 * Clamps a number between min and max (inclusive).
 */
export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
