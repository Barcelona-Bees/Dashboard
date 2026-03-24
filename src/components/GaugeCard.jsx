/**
 * GaugeCard – accessible metric display with value + range bar
 *
 * Design: Large numeric readout + horizontal bar showing value within
 * colored threshold ranges. No needle/arc; easy to read at a glance.
 *
 * Accessibility (WCAG 2.1, WAI-ARIA):
 * - role="meter" for read-only gauge semantics
 * - aria-valuenow, aria-valuemin, aria-valuemax (required)
 * - aria-label with value and status
 * - aria-valuetext for screen reader (e.g. "73 percent, good")
 * - Status conveyed via text badge, not color alone
 * - Uses CSS variables for theme (light/dark)
 */
import { useMemo } from "react";

const STATUS_COLORS = {
  green: "var(--success)",
  yellow: "var(--warning)",
  red: "var(--danger)",
  gray: "var(--text-muted)",
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Number(n)));
}

function statusForValue(value, ranges) {
  const r = ranges.find((seg) => value >= seg.from && value <= seg.to);
  return r ? r.color : "gray";
}

function segmentStyle(from, to, min, max, color) {
  const range = max - min;
  const left = ((from - min) / range) * 100;
  const width = ((to - from) / range) * 100;
  return {
    left: `${left}%`,
    width: `${width}%`,
    backgroundColor: STATUS_COLORS[color] || STATUS_COLORS.gray,
  };
}

export default function GaugeCard(props) {
  const {
    value,
    label,
    sublabel,
    unit = "",
    min,
    max,
    ranges,
    decimals = 2,
  } = props;

  const v = clamp(value, min, max);
  const status = statusForValue(v, ranges);
  const statusLabel = ranges.find((r) => v >= r.from && v <= r.to)?.label ?? "unknown";

  const ariaLabel = useMemo(() => {
    const valText = typeof v === "number" ? v.toFixed(decimals) : String(v);
    const unitText = unit ? ` ${unit}` : "";
    return `${label}: ${valText}${unitText}. Status: ${statusLabel}.`;
  }, [label, v, unit, decimals, statusLabel]);

  const valueText = useMemo(() => {
    const val = typeof v === "number" ? v.toFixed(decimals) : String(v);
    return unit ? `${val} ${unit}` : val;
  }, [v, unit, decimals]);

  const markerPosition = ((v - min) / (max - min)) * 100;

  return (
    <div
      className="gaugeCard"
      role="meter"
      aria-valuenow={v}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={ariaLabel}
      aria-valuetext={`${valueText}, ${statusLabel}`}
    >
      <div className="gaugeCardValue" style={{ color: STATUS_COLORS[status] }}>
        {valueText}
      </div>
      <div className="gaugeCardLabel">{sublabel ? `${label} ${sublabel}` : label}</div>

      <div className="gaugeBar" aria-hidden="true">
        <div className="gaugeBarTrack">
          {ranges.map((seg, i) => (
            <div
              key={i}
              className="gaugeBarSegment"
              style={segmentStyle(seg.from, seg.to, min, max, seg.color)}
            />
          ))}
        </div>
        <div
          className="gaugeBarMarker"
          style={{
            left: `${markerPosition}%`,
            backgroundColor: STATUS_COLORS[status],
          }}
          aria-hidden="true"
        />
      </div>

      <div className="gaugeCardStatus" data-status={status}>
        {statusLabel}
      </div>
    </div>
  );
}
