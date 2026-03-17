/**
 * DialGauge.jsx
 *
 * Visual goal:
 * - Thick colored bands for target zones UNDER a thick black base arc
 * - A needle from the center pointing at the current value
 * - Center readout (value + label)
 *
 * Accessibility:
 * - The <svg> has role="img" and an aria-label describing the reading and status.
 */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function degToRad(deg) {
  return (Math.PI / 180) * deg;
}

function polar(cx, cy, r, angleDeg) {
  const a = degToRad(angleDeg);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function valueToAngle(v, min, max, startAngle, endAngle) {
  const pct = (v - min) / (max - min);
  return startAngle + pct * (endAngle - startAngle);
}

function colorHex(name) {
  if (name === "green") return "#059669";
  if (name === "yellow") return "#f59e0b";
  if (name === "red") return "#dc2626";
  return "#94a3b8";
}

function statusForValue(v, ranges) {
  return ranges.find((r) => v >= r.from && v <= r.to)?.color ?? "gray";
}

export default function DialGauge(props) {
  const {
    label,
    value,
    unit = "",
    min,
    max,
    ranges,
    startAngle = 200,
    endAngle = 340,
    decimals = 2,
  } = props;

  const v = clamp(Number(value), min, max);
  const status = statusForValue(v, ranges);
  const needleColor = colorHex(status);

  // SVG layout
  const cx = 50, cy = 54;
  const rBand = 34;
  const rBase = 32;
  const rNeedle = 26;

  const angle = valueToAngle(v, min, max, startAngle, endAngle);
  const needleTip = polar(cx, cy, rNeedle, angle);

  const aria = `${label}: ${v.toFixed(decimals)}${unit}. Status ${status}.`;

  return (
    <svg width="120" height="120" viewBox="0 0 100 100" role="img" aria-label={aria}>
      {/* Thick colored target bands (UNDER) */}
      {ranges.map((seg, i) => {
        const a0 = valueToAngle(clamp(seg.from, min, max), min, max, startAngle, endAngle);
        const a1 = valueToAngle(clamp(seg.to, min, max), min, max, startAngle, endAngle);
        return (
          <path
            key={i}
            d={arcPath(cx, cy, rBand, a0, a1)}
            stroke={colorHex(seg.color)}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            opacity="0.98"
          />
        );
      })}

      {/* Thick black base arc (OVER the bands) */}
      <path
        d={arcPath(cx, cy, rBase, startAngle, endAngle)}
        stroke="#111"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />

      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleTip.x}
        y2={needleTip.y}
        stroke={needleColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="4.5" fill="#111" />
      <circle cx={cx} cy={cy} r="2.5" fill={needleColor} />

      {/* Value + label */}
      <text x="50" y="76" textAnchor="middle" fontSize="14" fontWeight="900" fill="#111">
        {v.toFixed(decimals)}
      </text>
      <text x="50" y="88" textAnchor="middle" fontSize="9" fontWeight="800" fill="#333">
        {label}
      </text>
    </svg>
  );
}
