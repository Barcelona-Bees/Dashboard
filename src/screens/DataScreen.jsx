import Modal from "../ui/Modal";
import { fake } from "../data/fake";
import { useMemo, useState } from "react";
import AccessibleLineChart from "../components/AccessibleLineChart";

export default function DataScreen({ onOpenExport }) {
  const seriesData = useMemo(() => fake.chart2w.map((p, idx) => ({
    xLabel: p.d,
    temperature: p.value,
    volume: 40 + (idx % 5) * 4,
    co2: 1.0 + (idx % 6) * 0.2,
    humidity: 55 + (idx % 7) * 3
  })), []);

  return (
    <div className="page">
      <div className="dataTopRow">
        <div className="center" style={{ flex: 1 }}>
          <div className="h1" style={{ fontSize: 18 }}>Historical data</div>
          <div className="smallMuted">last updated: {fake.updatedAt}</div>
        </div>
        <button className="exportBtn" onClick={onOpenExport}>Export</button>
      </div>

      <div className="dataGrid">
        <div className="chartFrame">
          <AccessibleLineChart
            title="2 week Temperature"
            data={seriesData}
            xLabelKey="xLabel"
            series={[{ key: "temperature", name: "Temperature (°F)" }]}
          />
        </div>

        <div className="chartFrame">
          <AccessibleLineChart
            title="2 week Volume"
            data={seriesData}
            xLabelKey="xLabel"
            series={[{ key: "volume", name: "Volume" }]}
          />
        </div>

        <div className="chartFrame">
          <AccessibleLineChart
            title="2 week CO2"
            data={seriesData}
            xLabelKey="xLabel"
            series={[{ key: "co2", name: "CO2 (%)" }]}
          />
        </div>

        <div className="chartFrame">
          <AccessibleLineChart
            title="2 week Humidity"
            data={seriesData}
            xLabelKey="xLabel"
            series={[{ key: "humidity", name: "Humidity (%)" }]}
          />
        </div>
      </div>
    </div>
  );
}

export function ExportModal({ onClose }) {
  const [temp, setTemp] = useState(true);
  const [co2, setCo2] = useState(true);
  const [humidity, setHumidity] = useState(true);
  const [type, setType] = useState("CSV");

  return (
    <Modal onClose={onClose}>
      <div className="modalTitle">Export data</div>

      <div className="modalRow">
        <label><input type="checkbox" checked={temp} onChange={(e) => setTemp(e.target.checked)} /> Temp</label>
        <label><input type="checkbox" checked={co2} onChange={(e) => setCo2(e.target.checked)} /> co2</label>
        <label><input type="checkbox" checked={humidity} onChange={(e) => setHumidity(e.target.checked)} /> Humidity</label>
      </div>

      <div className="modalRow">
        <div style={{ fontWeight: 800, fontSize: 13 }}>Export Type</div>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>CSV</option>
          <option>JSON</option>
          <option>PDF</option>
        </select>
      </div>

      <div className="modalActions">
        <button onClick={onClose} aria-label="Export">Export</button>
      </div>
    </Modal>
  );
}
