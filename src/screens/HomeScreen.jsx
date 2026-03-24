import { useState, useEffect } from "react";
import GaugeCard from "../components/GaugeCard";
import AccessibleLineChart from "../components/AccessibleLineChart";
import AlertCard from "../components/AlertCard";
import { HomeSkeleton } from "../components/Skeleton";
import { THRESHOLDS_F } from "../config/thresholds";
import { getCurrentReading, getTwoWeeksData } from "../services/api";
import { computeAlerts } from "../services/alerts";
import { transformToFrontendFormat, transformTo24HourChart } from "../services/dataTransform";
import { formatTimestamp, celsiusToFahrenheit } from "../utils/conversions";
import {
  getHourlyOutsideTempsByDate,
  buildExternalTempFMapForDate,
  getSyntheticExternalTempF,
} from "../services/weather";

export default function HomeScreen() {
  const [readings, setReadings] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartDateStr, setChartDateStr] = useState(null); // YYYY-MM-DD for weather alignment
  const [externalTempByHour, setExternalTempByHour] = useState(null); // { "0:00": 45, ... } in °F, or null if using synthetic
  const [currentOutsideTempF, setCurrentOutsideTempF] = useState(null); // single value for hero when we have weather
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [current, twoWeeks] = await Promise.all([
          getCurrentReading(),
          getTwoWeeksData(),
        ]);

        const frontendReadings = transformToFrontendFormat(current);
        setReadings(frontendReadings);

        const last24h = twoWeeks.slice(-144);
        const chart24h = transformTo24HourChart(last24h);
        setChartData(chart24h);

        const dateStr =
          last24h.length > 0
            ? new Date(last24h[last24h.length - 1].timestamp).toISOString().split("T")[0]
            : null;
        setChartDateStr(dateStr);

        try {
          const weatherMap = await getHourlyOutsideTempsByDate();
          const now = new Date();
          const todayStr = now.toISOString().split("T")[0];
          const hourLabel = `${now.getHours()}:00`;

          // Outside temps should reflect *current* Rochester weather whenever available,
          // even if backend chart data is from an older date.
          const forToday = buildExternalTempFMapForDate(todayStr, weatherMap, celsiusToFahrenheit);
          const hasTodayWeather = Object.keys(forToday).length > 0;

          // Chart outside line: use today's Rochester hourly temps (keys match "0:00".."23:00").
          setExternalTempByHour(hasTodayWeather ? forToday : null);

          if (hasTodayWeather) {
            const forCurrentHour = forToday[hourLabel];
            const fallbackHour = (() => {
              const hours = Object.keys(forToday)
                .map((k) => parseInt(k.split(":")[0], 10))
                .filter((n) => !Number.isNaN(n));
              const maxH = hours.length ? Math.max(...hours) : 23;
              return forToday[`${maxH}:00`];
            })();
            setCurrentOutsideTempF(forCurrentHour != null ? forCurrentHour : fallbackHour);
          } else {
            setCurrentOutsideTempF(null);
          }
        } catch (weatherErr) {
          console.warn("Outside temp from weather API unavailable, using estimate:", weatherErr);
          setExternalTempByHour(null);
          setCurrentOutsideTempF(null);
        }

        setUpdatedAt(formatTimestamp(current.timestamp));
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please check if the backend server is running.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <HomeSkeleton />;
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

  if (!readings) return null;

  return (
    <div className="page">
      <div className="center">
        <div className="h1">Current Readings</div>
        <div className="smallMuted">last updated: {updatedAt}</div>
      </div>

      <div className="heroRow">
        <div className="heroMetric">
          <div className="heroMetricLabel">Outside temperature</div>
          <div className="heroMetricValue">
            {(currentOutsideTempF != null
              ? currentOutsideTempF
              : getSyntheticExternalTempF(readings.internalTemp, new Date().getHours())
            ).toFixed(1)}°F
          </div>
        </div>
        <div className="heroMetric">
          <div className="heroMetricLabel">Inside hive temperature</div>
          <div className="heroMetricValue">
            {readings.internalTemp.toFixed(1)}°F
          </div>
        </div>
      </div>

      <div className="grid2">
        <GaugeCard
          value={readings.humidity}
          label="Humidity"
          unit="%"
          min={THRESHOLDS_F.humidityPct.min}
          max={THRESHOLDS_F.humidityPct.max}
          ranges={THRESHOLDS_F.humidityPct.ranges}
          decimals={0}
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
      </div>

      <section className="pageSection" aria-labelledby="hardware-heading">
        <h2 id="hardware-heading" className="pageSectionTitle">Hardware info</h2>
        <div className="hardwareInfoRow">
          <div className="hardwareInfoCard" aria-label="Connection status">
            <span className="hardwareInfoLabel">Connection</span>
            <span className="hardwareInfoValue">{readings.connectionStatus}</span>
          </div>
          <div className="hardwareInfoCard" aria-label="Package loss">
            <span className="hardwareInfoLabel">Package loss</span>
            <span className="hardwareInfoValue">{readings.packageLoss}</span>
          </div>
          <div className="hardwareInfoCard" aria-label="Battery level">
            <span className="hardwareInfoLabel">Battery</span>
            <span className="hardwareInfoValue">{readings.batteryPct}%</span>
          </div>
        </div>
      </section>

      <section className="pageSection" aria-labelledby="chart-heading">
        <h2 id="chart-heading" className="pageSectionTitle">Temperature comparison</h2>
        <div className="chartFrame">
          <AccessibleLineChart
            title="Inside vs outside temperature (last 24 hours)"
            data={chartData.map((p, i) => {
              const externalF =
                externalTempByHour != null && externalTempByHour[p.t] != null
                  ? externalTempByHour[p.t]
                  : getSyntheticExternalTempF(p.internalTempF, i);
              return {
                xLabel: p.t,
                internalTemp: p.internalTempF,
                externalTemp: externalF,
              };
            })}
            xLabelKey="xLabel"
            series={[
              { key: "internalTemp", name: "Inside hive (°F)" },
              { key: "externalTemp", name: "Outside (°F)" },
            ]}
          />
          <div className="chartCaption">
            Time of day (24-hour clock).
            {externalTempByHour != null
              ? " Outside temperature from weather (Open-Meteo)."
              : " Outside temperature estimated (no weather data for this date)."}
          </div>
        </div>
      </section>

      <section className="pageSection" aria-labelledby="alerts-heading">
        <h2 id="alerts-heading" className="pageSectionTitle">Alerts</h2>
        <div className="stack">
          {computeAlerts(readings).length === 0 ? (
            <div className="emptyState">
              No active alerts — hive looks healthy
            </div>
          ) : (
            computeAlerts(readings).map((a) => (
              <AlertCard
                key={a.id}
                type={a.type}
                text={a.text}
                severity={a.severity}
                time={a.time}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}