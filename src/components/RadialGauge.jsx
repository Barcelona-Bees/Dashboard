function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (Math.PI / 180) * angleDeg;
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}

export default function RadialGauge({ value, min = 0, max = 100, ariaLabel }) {
  const v = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, ""));
  const pct = (clamp(v, min, max) - min) / (max - min);

  // Matches your wireframe: thick black arc with a green progress segment
  const cx = 44, cy = 44, r = 30;
  const start = 220;
  const end = -40;
  const sweep = start - end;
  const ang = start - sweep * pct;

  const p0 = polarToCartesian(cx, cy, r, start);
  const p1 = polarToCartesian(cx, cy, r, end);
  const p = polarToCartesian(cx, cy, r, ang);

  const largeArc = pct > 0.5 ? 1 : 0;

  const basePath = `M ${p0.x} ${p0.y} A ${r} ${r} 0 1 0 ${p1.x} ${p1.y}`;
  const progPath = `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} 0 ${p.x} ${p.y}`;

  return (
    <svg
      width="88"
      height="88"
      viewBox="0 0 88 88"
      role="img"
      aria-label={ariaLabel}
    >
      <path d={basePath} stroke="#111" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d={progPath} stroke="#2f9e5f" strokeWidth="8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
