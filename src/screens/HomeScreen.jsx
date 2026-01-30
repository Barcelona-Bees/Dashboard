import GaugeCard from "../components/GaugeCard";
import AlertCard from "../components/AlertCard";
import AccessibleLineChart from "../components/AccessibleLineChart";
import { fake } from "../data/fake";
import { THRESHOLDS_F } from "../config/thresholds";

export default function HomeScreen() {
  const r = fake.readings;

  return (
    <div className="page">
      <div className="center">
        <div className="h1">Current Readings</div>
        <div className="smallMuted">last updated: {fake.updatedAt}</div>
      </div>

      <div className="grid2">
        <GaugeCard
          value={r.externalTemp}
          label="Degrees (F)"
          sublabel="External"
          unit="°F"
          min={THRESHOLDS_F.externalTempF.min}
          max={THRESHOLDS_F.externalTempF.max}
          ranges={THRESHOLDS_F.externalTempF.ranges}
          decimals={2}
        />

        <GaugeCard
          value={r.internalTemp}
          label="Degrees (F)"
          sublabel="Internal"
          unit="°F"
          min={THRESHOLDS_F.internalTempF.min}
          max={THRESHOLDS_F.internalTempF.max}
          ranges={THRESHOLDS_F.internalTempF.ranges}
          decimals={2}
        />

        <GaugeCard
          value={r.co2}
          label="CO2"
          unit="%"
          min={THRESHOLDS_F.co2Pct.min}
          max={THRESHOLDS_F.co2Pct.max}
          ranges={THRESHOLDS_F.co2Pct.ranges}
          decimals={2}
        />

        <GaugeCard
          value={r.humidity}
          label="Humidity"
          unit="%"
          min={THRESHOLDS_F.humidityPct.min}
          max={THRESHOLDS_F.humidityPct.max}
          ranges={THRESHOLDS_F.humidityPct.ranges}
          decimals={0}
        />
      </div>

      <div className="desktopRow">
        <div className="sideStack">
          <div className="miniStatus" aria-label="Connection status">
            <small>Connection Status</small>
            <div className="big">{r.connectionStatus}</div>
          </div>
          <div className="miniStatus" style={{ marginTop: 10 }} aria-label="Package loss">
            <small>Package Loss</small>
            <div className="big">{r.packageLoss}</div>
          </div>
        </div>

        <div className="chartFrame">
          <AccessibleLineChart
            title=""
            data={fake.chart24h.map((p) => ({
              xLabel: p.t,
              humidity: p.humidity,
              temperature: p.temp,
            }))}
            xLabelKey="xLabel"
            series={[
              { key: "humidity", name: "Humidity (%)" },
              { key: "temperature", name: "Temperature (°F)" },
            ]}
          />
          <div className="chartCaption">Time (24-hour system)</div>
        </div>
      </div>

      <div className="sectionTitle">Alerts</div>
      <div className="stack">
        {fake.alerts.slice(0, 2).map((a) => (
          <AlertCard
            key={a.id}
            type={a.type}
            text={a.text}
            severity={a.severity}
            time={a.time}
          />
        ))}
      </div>

      <button className="statusBtn" aria-label="Connection status large">
        Connection Status
        <div>{r.connectionStatus}</div>
      </button>
    </div>
  );
}
