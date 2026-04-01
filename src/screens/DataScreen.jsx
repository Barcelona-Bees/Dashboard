/* Historical charts: reads real two-week series from GET /temp/twoweeks (+ humidity merge in api.js). */
import Modal from "../ui/Modal";
import { DataSkeleton } from "../components/Skeleton";
import { useState, useEffect } from "react";
import AccessibleLineChart from "../components/AccessibleLineChart";
import { getTwoWeeksData } from "../services/api";
import { transformTo2WeekChart } from "../services/dataTransform";
import { formatTimestamp } from "../utils/conversions";

export default function DataScreen({ onOpenExport }) {
  const [seriesData, setSeriesData] = useState([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const data = await getTwoWeeksData();
        const chartData = transformTo2WeekChart(data);

        // Daily average humidity keyed by calendar day (aligned with chart points via dateStr).
        const dailyHumidity = {};
        data.forEach(({ timestamp, humidity }) => {
          const dayKey = new Date(timestamp).toISOString().split("T")[0];
          if (!dailyHumidity[dayKey]) dailyHumidity[dayKey] = [];
          if (humidity != null && !Number.isNaN(humidity)) {
            dailyHumidity[dayKey].push(humidity);
          }
        });

        const formatted = chartData.map((p) => {
          const arr = dailyHumidity[p.dateStr];
          const avgH =
            arr && arr.length > 0
              ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
              : null;
          return {
            xLabel: p.d,
            temperature: p.value,
            humidity: avgH,
          };
        });

        setSeriesData(formatted);
        const mostRecentTimestamp =
          data.length > 0 ? data[data.length - 1].timestamp : null;
        setUpdatedAt(
          mostRecentTimestamp ? formatTimestamp(mostRecentTimestamp) : ""
        );
      } catch (err) {
        console.error("Error fetching data:", err);
        const msg = err instanceof Error ? err.message : "";
        setError(
          msg.includes("fetch") || msg.includes("Network")
            ? "Cannot reach the API. Start the backend and check VITE_API_BASE."
            : msg || "Request failed."
        );
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
          <div className="h1" style={{ color: "var(--danger)" }}>
            Error
          </div>
          <div className="smallMuted">{error}</div>
        </div>
      </div>
    );
  }

  const hasData = seriesData.length > 0;
  // Omit days with no humidity so the line chart y-scale stays numeric (avoids null/NaN in SVG).
  const humidityChartData = seriesData.filter((p) => p.humidity != null);
  const hasHumidity = humidityChartData.length > 0;

  return (
    <div className="page">
      <div className="dataTopRow">
        <div className="center" style={{ flex: 1 }}>
          <div className="h1" style={{ fontSize: 18 }}>
            2-week overview
          </div>
          <div className="smallMuted">last updated: {updatedAt}</div>
        </div>
        <button
          className="exportBtn"
          onClick={onOpenExport}
          disabled={!hasData}
        >
          Export
        </button>
      </div>

      {!hasData ? (
        <div className="emptyState" style={{ marginTop: 24 }}>
          No historical data yet. Data will appear once the sensor starts
          reporting.
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
            {hasHumidity ? (
              <AccessibleLineChart
                title="2 week Humidity"
                data={humidityChartData}
                xLabelKey="xLabel"
                series={[{ key: "humidity", name: "Humidity (%)" }]}
              />
            ) : (
              <div className="emptyState" style={{ padding: 24 }}>
                No humidity history in this range — upload humidity or ensure
                /Humidity/twoweeks returns rows.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ExportModal({ onClose }) {
  const [temp, setTemp] = useState(true);
  const [humidity, setHumidity] = useState(true);
  const [type, setType] = useState("CSV");

  return (
    <Modal onClose={onClose}>
      <div className="modalTitle">Export data</div>

      <div className="modalRow">
        <label>
          <input
            type="checkbox"
            checked={temp}
            onChange={(e) => setTemp(e.target.checked)}
          />{" "}
          Temp
        </label>
        <label>
          <input
            type="checkbox"
            checked={humidity}
            onChange={(e) => setHumidity(e.target.checked)}
          />{" "}
          Humidity
        </label>
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
        <button onClick={onClose} aria-label="Export">
          Export
        </button>
      </div>
    </Modal>
  );
}
