import { useState, useEffect } from "react";
import GaugeCard from "../components/GaugeCard";
import AlertCard from "../components/AlertCard";
import AccessibleLineChart from "../components/AccessibleLineChart";
import { THRESHOLDS_F } from "../config/thresholds";
import { getCurrentReading, getTwoWeeksData } from "../services/api";
import { transformToFrontendFormat, transformTo24HourChart } from "../services/dataTransform";
import { formatTimestamp } from "../utils/conversions";

export default function HomeScreen() {
  const [readings, setReadings] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch current reading and chart data in parallel
        const [current, twoWeeks] = await Promise.all([
          getCurrentReading(),
          getTwoWeeksData(),
        ]);
        
        // Transform data
        const frontendReadings = transformToFrontendFormat(current);
        setReadings(frontendReadings);
        
        // Get last 24 hours for chart (or use all if less than 24h)
        const last24h = twoWeeks.slice(-144); // 144 = 24 hours * 6 (10-min intervals)
        const chart24h = transformTo24HourChart(last24h);
        setChartData(chart24h);
        
        setUpdatedAt(formatTimestamp(current.timestamp));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please check if the backend server is running.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="center">
          <div className="h1">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="center">
          <div className="h1" style={{ color: '#d64545' }}>Error</div>
          <div className="smallMuted">{error}</div>
        </div>
      </div>
    );
  }

  if (!readings) return null;

  return (
    <div className="page">
      <div className="center">
        <div className="h1">Current Readings</div>
        <div className="smallMuted">last updated: {updatedAt}</div>
      </div>

      <div className="grid2">
        <GaugeCard
          value={readings.externalTemp}
          label="Degrees (F)"
          sublabel="External"
          unit="°F"
          min={THRESHOLDS_F.externalTempF.min}
          max={THRESHOLDS_F.externalTempF.max}
          ranges={THRESHOLDS_F.externalTempF.ranges}
          decimals={2}
        />

        <GaugeCard
          value={readings.internalTemp}
          label="Degrees (F)"
          sublabel="Internal"
          unit="°F"
          min={THRESHOLDS_F.internalTempF.min}
          max={THRESHOLDS_F.internalTempF.max}
          ranges={THRESHOLDS_F.internalTempF.ranges}
          decimals={2}
        />

        <GaugeCard
          value={readings.co2}
          label="CO2"
          unit="%"
          min={THRESHOLDS_F.co2Pct.min}
          max={THRESHOLDS_F.co2Pct.max}
          ranges={THRESHOLDS_F.co2Pct.ranges}
          decimals={2}
        />

        <GaugeCard
          value={readings.humidity}
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
            <div className="big">{readings.connectionStatus}</div>
          </div>
          <div className="miniStatus" style={{ marginTop: 10 }} aria-label="Package loss">
            <small>Package Loss</small>
            <div className="big">{readings.packageLoss}</div>
          </div>
        </div>

        <div className="chartFrame">
          <AccessibleLineChart
            title=""
            data={chartData.map((p) => ({
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

      {/* Keep alerts for now - you can add real alert logic later */}
      <div className="sectionTitle">Alerts</div>
      <div className="stack">
        <div className="smallMuted" style={{ textAlign: 'center', padding: '10px' }}>
          No active alerts
        </div>
      </div>

      <button className="statusBtn" aria-label="Connection status large">
        Connection Status
        <div>{readings.connectionStatus}</div>
      </button>
    </div>
  );
}