/**
 * AccessibleLineChart.jsx
 *
 * Features:
 * - Hover snaps to nearest data point
 * - Click + drag scrubs along the timeline
 * - Keyboard support (Left/Right arrows)
 * - Readout under chart shows current time + values
 *
 * SVG-based so we can match wireframes and keep accessibility under our control.
 */

import React, { useMemo, useRef, useState } from "react";

function nearestIndex(xs, x) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < xs.length; i++) {
    const d = Math.abs(xs[i] - x);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export default function AccessibleLineChart(props) {
  const {
    title = "",
    data,
    xLabelKey = "xLabel",
    series = [
      { key: "humidity", name: "Relative humidity" },
      { key: "temperature", name: "Surrounding temperature" },
    ],
    height = 180,
  } = props;

  const w = 520;
  const h = height;
  const pad = 24;

  const [active, setActive] = useState(0);
  const svgRef = useRef(null);

  const xLabels = useMemo(() => data.map((d) => d[xLabelKey]), [data, xLabelKey]);

  const allY = useMemo(() => {
    const ys = [];
    for (const d of data) for (const s of series) ys.push(d[s.key]);
    return ys;
  }, [data, series]);

  const yMin = Math.min(...allY);
  const yMax = Math.max(...allY);
  const ySpan = (yMax - yMin) || 1;

  const xs = useMemo(() => {
    const n = data.length;
    return data.map((_, i) => pad + (i * (w - pad * 2)) / Math.max(1, n - 1));
  }, [data.length]);

  const yFor = (val) => {
    const t = (val - yMin) / ySpan;
    return (h - pad) - t * (h - pad * 2);
  };

  const paths = useMemo(() => {
    return series.map((s) => {
      const pts = data.map((d, i) => `${xs[i]},${yFor(d[s.key])}`).join(" ");
      return { ...s, pts };
    });
  }, [data, series, xs]);

  const activeX = xs[active] ?? xs[0];
  const activeLabel = xLabels[active] ?? "";

  const activeText = series
    .map((s) => `${s.name}: ${data[active]?.[s.key]}`)
    .join(", ");

  const onPointer = (clientX) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * w;
    setActive(nearestIndex(xs, x));
  };

  return (
    <div style={{ userSelect: "none" }}>
      <svg
        ref={svgRef}
        width="100%"
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`${title || "Chart"}. ${activeLabel}. ${activeText}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setActive((i) => Math.max(0, i - 1));
          if (e.key === "ArrowRight") setActive((i) => Math.min(data.length - 1, i + 1));
        }}
        onPointerDown={(e) => onPointer(e.clientX)}
        onPointerMove={(e) => {
          if (e.buttons) onPointer(e.clientX);
        }}
        onMouseMove={(e) => onPointer(e.clientX)}
      >
        {/* Grid */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={"h" + i}
            x1="0"
            y1={10 + i * 18}
            x2={w}
            y2={10 + i * 18}
            stroke="rgba(0,0,0,0.08)"
          />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line
            key={"v" + i}
            x1={i * 52}
            y1="0"
            x2={i * 52}
            y2={h}
            stroke="rgba(0,0,0,0.08)"
          />
        ))}

        {/* Lines */}
        {paths.map((p, idx) => (
          <polyline
            key={p.key}
            fill="none"
            stroke={idx === 0 ? "rgb(40, 120, 200)" : "rgb(220, 80, 60)"}
            strokeWidth="2.5"
            points={p.pts}
          />
        ))}

        {/* Active vertical line */}
        <line
          x1={activeX}
          y1={pad - 6}
          x2={activeX}
          y2={h - pad + 6}
          stroke="rgba(0,0,0,0.25)"
        />

        {/* Active points */}
        {series.map((s, idx) => {
          const y = yFor(data[active]?.[s.key]);
          return (
            <circle
              key={s.key}
              cx={activeX}
              cy={y}
              r="4.5"
              fill={idx === 0 ? "rgb(40, 120, 200)" : "rgb(220, 80, 60)"}
              stroke="#fff"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      {/* Always-visible readout */}
      <div style={{ fontSize: 12, color: "#333", marginTop: 6, textAlign: "center" }}>
        <strong>{activeLabel}</strong> — {activeText}
      </div>
    </div>
  );
}
