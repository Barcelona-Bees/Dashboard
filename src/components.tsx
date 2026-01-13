import React from "react";

type Props = {
  value: number;
  min?: number;
  max?: number;
  units?: string;
  label?: string;
  size?: number;
  strokeWidth?: number;
  warnAt?: number;
  dangerAt?: number;
};

export default function CircularGauge({
  value,
  min = 0,
  max = 100,
  units = "",
  label = "Now",
  size = 180,
  strokeWidth = 14,
  warnAt,
  dangerAt,
}: Props) {
  const clamped = Math.min(Math.max(value, min), max);
  const r = (size - strokeWidth) / 2;
  const C = 2 * Math.PI * r;
  const pct = (clamped - min) / (max - min);
  const dash = Math.max(0.0001, pct) * C;
  const gap = C - dash;

  // color thresholds
  let color = "#22c55e";
  if (warnAt !== undefined && value >= warnAt) color = "#f59e0b";
  if (dangerAt !== undefined && value >= dangerAt) color = "#ef4444";

  return (
    <div style={{ width: size, height: size }} className="relative grid place-items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* rotate ONLY the ring group so the start is at 12 o'clock */}
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="#232327"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${dash} ${gap}`}
          />
        </g>
      </svg>

      {/* Center text: NO rotation here */}
      <div className="absolute text-center">
        <div className="text-xs uppercase opacity-70 tracking-widest">{label}</div>
        {(() => {
          const [whole, dec] = clamped.toFixed(1).split(".");
          return (
            <div className="gauge-num tabular">
              <span className="whole text-5xl md:text-6xl font-extrabold">{whole}</span>
              <span className="dec">.{dec}</span>
              <span className="unit">{units}</span>
            </div>
          );
        })()}
        <div className="text-[10px] opacity-60">
          {min}{units} – {max}{units}
        </div>
      </div>
    </div>
  );
}
