import Modal from "../ui/Modal";
import { DataSkeleton } from "../components/Skeleton";
import { useState, useEffect } from "react";
import AccessibleLineChart from "../components/AccessibleLineChart";
import { getTwoWeeksData } from "../services/api";
import { transformTo2WeekChart } from "../services/dataTransform";
import { formatTimestamp } from "../utils/conversions";

export default function DataScreen({ onOpenExport }) {
  const [seriesData, setSeriesData] = useState([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getTwoWeeksData();
        const chartData = transformTo2WeekChart(data);
        
        // Calculate humidity averages per day
        const humidityData = {};
        data.forEach(({ timestamp, humidity }) => {
          const date = new Date(timestamp);
          const dayKey = date.toISOString().split('T')[0];
          if (!humidityData[dayKey]) {
            humidityData[dayKey] = [];
          }
          humidityData[dayKey].push(humidity);
        });
        
        const days = Object.entries(humidityData).sort();
        const avgHumidity = days.map(([, humidities]) => 
          Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length)
        );
        
        // Transform for chart component
        const formatted = chartData.map((p, idx) => ({
          xLabel: p.d,
          temperature: p.value,
          volume: 40 + (idx % 5) * 4, // TODO: Replace with real volume data when available
          co2: 0.5 + (idx % 6) * 0.2, // TODO: Replace with real CO2 data when available
          humidity: avgHumidity[idx] || 55, // Use actual humidity data
        }));
        
        setSeriesData(formatted);
        // Use the timestamp from the most recent data point
        const mostRecentTimestamp = data.length > 0 ? data[data.length - 1].timestamp : null;
        setUpdatedAt(mostRecentTimestamp ? formatTimestamp(mostRecentTimestamp) : '');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please check if the backend server is running.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) {
    return <DataSkeleton />;
  }

  if (error) {
    return (
      <div className="page">
        <div className="center">
          <div className="h1" style={{ color: 'var(--danger)' }}>Error</div>
          <div className="smallMuted">{error}</div>
        </div>
      </div>
    );
  }

  const hasData = seriesData.length > 0;

  return (
    <div className="page">
      <div className="dataTopRow">
        <div className="center" style={{ flex: 1 }}>
          <div className="h1" style={{ fontSize: 18 }}>2-week overview</div>
          <div className="smallMuted">last updated: {updatedAt}</div>
        </div>
        <button className="exportBtn" onClick={onOpenExport} disabled={!hasData}>Export</button>
      </div>

      {!hasData ? (
        <div className="emptyState" style={{ marginTop: 24 }}>
          No historical data yet. Data will appear once the sensor starts reporting.
        </div>
      ) : (
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
      )}
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