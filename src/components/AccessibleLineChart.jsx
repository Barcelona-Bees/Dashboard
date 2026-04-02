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
    height = 200,
    /** Optional per-series stroke colors (e.g. one color for temp-only charts). */
    seriesColors: seriesColorsProp,
  } = props;

  const seriesColors = seriesColorsProp ?? ["var(--primary)", "var(--accent)"];

  const pad = 24;
  const leftAxisWidth = 40;
  const plotWidth = 520 - leftAxisWidth - pad; // right pad
  const w = 520 + leftAxisWidth;
  const h = height;
  const plotLeft = leftAxisWidth;
  const plotRight = leftAxisWidth + plotWidth;
  const plotTop = pad;
  const plotBottom = h - pad;
  const plotHeight = plotBottom - plotTop;

  const [active, setActive] = useState(0);
  const svgRef = useRef(null);

  const xLabels = useMemo(() => data.map((d) => d[xLabelKey]), [data, xLabelKey]);

  const allY = useMemo(() => {
    const ys = [];
    for (const d of data) for (const s of series) ys.push(d[s.key]);
    return ys;
  }, [data, series]);

  if (!data || data.length === 0 || allY.length === 0) {
    return (
      <div className="chartRoot" role="status" aria-live="polite">
        <p className="emptyState">No data to display for this chart.</p>
      </div>
    );
  }

  const yMin = Math.min(...allY);
  const yMax = Math.max(...allY);
  if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) {
    return (
      <div className="chartRoot" role="status" aria-live="polite">
        <p className="emptyState">Chart data is invalid or incomplete.</p>
      </div>
    );
  }
  const ySpan = (yMax - yMin) || 1;

  const xs = useMemo(() => {
    const n = data.length;
    return data.map((_, i) => plotLeft + (i * plotWidth) / Math.max(1, n - 1));
  }, [data.length, plotLeft, plotWidth]);

  const yFor = (val) => {
    const t = (val - yMin) / ySpan;
    return plotBottom - t * plotHeight;
  };

  const yTicks = useMemo(() => {
    const span = yMax - yMin;
    const step = span <= 2 ? 0.5 : span <= 10 ? 2 : span <= 25 ? 5 : 10;
    const low = Math.floor(yMin / step) * step;
    const high = Math.ceil(yMax / step) * step;
    const ticks = [];
    for (let v = low; v <= high; v += step) {
      if (v >= yMin - 0.01 && v <= yMax + 0.01) ticks.push(v);
    }
    if (ticks.length < 2) ticks.push(yMin, yMax);
    return ticks.sort((a, b) => a - b);
  }, [yMin, yMax]);

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
    <div className="chartRoot">
      {/* Legend */}
      <div className="chartLegend" role="list" aria-label="Chart series">
        {series.map((s, idx) => (
          <div key={s.key} className="chartLegendItem" role="listitem">
            <span
              className="chartLegendSwatch"
              style={{ backgroundColor: seriesColors[idx % seriesColors.length] }}
              aria-hidden
            />
            <span>{s.name}</span>
          </div>
        ))}
      </div>

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
        {/* Y-axis tick labels */}
        {yTicks.map((val) => {
          const y = yFor(val);
          return (
            <g key={val}>
              <line
                x1={plotLeft}
                y1={y}
                x2={plotRight}
                y2={y}
                stroke="var(--chart-grid-strong)"
                strokeDasharray="2 2"
              />
              <text
                x={plotLeft - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="10"
                fill="var(--chart-axis-text)"
              >
                {Number.isInteger(val) ? val : val.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Vertical grid lines */}
        {Array.from({ length: 11 }).map((_, i) => (
          <line
            key={"v" + i}
            x1={plotLeft + (i * plotWidth) / 10}
            y1={plotTop}
            x2={plotLeft + (i * plotWidth) / 10}
            y2={plotBottom}
            stroke="var(--chart-grid)"
          />
        ))}

        {/* Lines */}
        {paths.map((p, idx) => (
          <polyline
            key={p.key}
            fill="none"
            stroke={seriesColors[idx % seriesColors.length]}
            strokeWidth="2.5"
            points={p.pts}
          />
        ))}

        {/* Active vertical line */}
        <line
          x1={activeX}
          y1={plotTop - 6}
          x2={activeX}
          y2={plotBottom + 6}
          stroke="var(--chart-grid-strong)"
          strokeOpacity={0.9}
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
              fill={seriesColors[idx % seriesColors.length]}
              stroke="var(--surface-main)"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      {/* Always-visible readout */}
      <div className="chartReadout" aria-live="polite">
        <strong>{activeLabel}</strong> — {activeText}
      </div>
    </div>
  );
}
