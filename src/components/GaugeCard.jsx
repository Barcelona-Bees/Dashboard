/**
 * GaugeCard.jsx
 *
 * A single tile in the 2x2 grid.
 * Contains the dial gauge + readout + labels.
 */
import DialGauge from "./DialGauge";

export default function GaugeCard(props) {
  const {
    value,
    label,
    sublabel,
    unit,
    min,
    max,
    ranges,
    decimals = 2,
  } = props;

  const title = sublabel ? `${label} ${sublabel}` : label;

  return (
    <div className="card">
      <div className="center">
        <DialGauge
          label={title}
          value={value}
          unit={unit}
          min={min}
          max={max}
          ranges={ranges}
          decimals={decimals}
        />
        <div className="gaugeValue">
          {typeof value === "number" ? value.toFixed(decimals) : value}
          {unit ? ` ${unit}` : ""}
        </div>
        <div className="gaugeLabel">{label}</div>
        {sublabel ? <div className="gaugeSub">{sublabel}</div> : null}
      </div>
    </div>
  );
}
