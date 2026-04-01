import { useState, useEffect, useRef } from "react";
import GaugeCard from "../components/GaugeCard";
import AccessibleLineChart from "../components/AccessibleLineChart";
import AlertCard from "../components/AlertCard";
import { HomeSkeleton } from "../components/Skeleton";
import { THRESHOLDS_F } from "../config/thresholds";
import {
  getCurrentReadingAlt,
  getTwoWeeksData,
  subscribeReadingUpdates,
} from "../services/api";
import {
  collectAlertsFromPoints,
  filterPointsInLocalCalendarDay,
} from "../services/alerts";
import { transformToFrontendFormat, transformTo24HourChart } from "../services/dataTransform";
import { formatTimestamp, celsiusToFahrenheit } from "../utils/conversions";
import {
  getHourlyOutsideTempsByDate,
  buildExternalTempFMapForDate,
  getSyntheticExternalTempF,
} from "../services/weather";
import { loadHomeSnapshot, saveHomeSnapshot } from "../services/homeCache";

/**
 * Fallback poll when SSE is unavailable. Default ~10 min — keeps VM/API load minimal.
 * SSE still pushes fresh readings (debounced). Override with `VITE_HOME_POLL_MS` (min 3000).
 */
const HOME_POLL_MS = (() => {
  const raw =
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_HOME_POLL_MS : undefined;
  const n = raw != null && String(raw).trim() !== "" ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 3000 ? n : 600_000;
})();

const initialSnap = typeof window !== "undefined" ? loadHomeSnapshot() : null;

/** Coalesce burst SSE `reading` events into one refresh. */
const SSE_DEBOUNCE_MS = 350;

export default function HomeScreen() {
  const contentShownRef = useRef(!!initialSnap);

  const [readings, setReadings] = useState(initialSnap?.readings ?? null);
  const [chartData, setChartData] = useState(initialSnap?.chartData ?? []);
  const [chartDateStr, setChartDateStr] = useState(initialSnap?.chartDateStr ?? null); // YYYY-MM-DD for weather alignment
  const [externalTempByHour, setExternalTempByHour] = useState(
    initialSnap?.externalTempByHour ?? null
  ); // { "0:00": 45, ... } in °F, or null if using synthetic
  const [currentOutsideTempF, setCurrentOutsideTempF] = useState(
    initialSnap?.currentOutsideTempF ?? null
  ); // single value for hero when we have weather
  const [updatedAt, setUpdatedAt] = useState(initialSnap?.updatedAt ?? "");
  const [loading, setLoading] = useState(!initialSnap);
  const [error, setError] = useState(null);
  const [empty, setEmpty] = useState(initialSnap?.empty ?? false);
  const [todayAlerts, setTodayAlerts] = useState(initialSnap?.todayAlerts ?? []);

  useEffect(() => {
    let cancelled = false;
    let fetchInFlight = false;
    let sseDebounceTimer = null;
    let lastOkFetchAt = initialSnap?.savedAt ?? 0;

    /** @param {boolean} silent When true, skip full-page loading skeleton (background poll / tab focus). */
    async function fetchData(silent = false) {
      if (fetchInFlight) return;
      fetchInFlight = true;
      try {
        if (!silent) {
          setLoading(true);
        }
        setError(null);
        setEmpty(false);

        const [latest, twoWeeks] = await Promise.all([
          getCurrentReadingAlt(),
          getTwoWeeksData(),
        ]);

        if (cancelled) return;

        const current =
          latest ??
          (twoWeeks.length > 0 ? twoWeeks[twoWeeks.length - 1] : null);

        if (current == null) {
          setReadings(null);
          setChartData([]);
          setChartDateStr(null);
          setExternalTempByHour(null);
          setCurrentOutsideTempF(null);
          setUpdatedAt("");
          setEmpty(true);
          saveHomeSnapshot({
            readings: null,
            chartData: [],
            chartDateStr: null,
            externalTempByHour: null,
            currentOutsideTempF: null,
            updatedAt: "",
            empty: true,
            todayAlerts: [],
          });
          setTodayAlerts([]);
          contentShownRef.current = true;
          lastOkFetchAt = Date.now();
          return;
        }

        const frontendReadings = transformToFrontendFormat(current);
        setReadings(frontendReadings);

        const last24h = twoWeeks.slice(-144);
        const chart24h = transformTo24HourChart(last24h);
        setChartData(chart24h);

        const todayPoints = filterPointsInLocalCalendarDay(twoWeeks, new Date());
        const todayAlertsList = collectAlertsFromPoints(todayPoints);
        setTodayAlerts(todayAlertsList);

        const dateStr =
          last24h.length > 0
            ? new Date(last24h[last24h.length - 1].timestamp).toISOString().split("T")[0]
            : null;
        setChartDateStr(dateStr);

        let extHour = null;
        let outsideF = null;
        try {
          const weatherMap = await getHourlyOutsideTempsByDate();
          if (cancelled) return;
          const now = new Date();
          const todayStr = now.toISOString().split("T")[0];
          const hourLabel = `${now.getHours()}:00`;

          // Outside temps should reflect *current* Rochester weather whenever available,
          // even if backend chart data is from an older date.
          const forToday = buildExternalTempFMapForDate(todayStr, weatherMap, celsiusToFahrenheit);
          const hasTodayWeather = Object.keys(forToday).length > 0;

          // Chart outside line: use today's Rochester hourly temps (keys match "0:00".."23:00").
          extHour = hasTodayWeather ? forToday : null;
          setExternalTempByHour(extHour);

          if (hasTodayWeather) {
            const forCurrentHour = forToday[hourLabel];
            const fallbackHour = (() => {
              const hours = Object.keys(forToday)
                .map((k) => parseInt(k.split(":")[0], 10))
                .filter((n) => !Number.isNaN(n));
              const maxH = hours.length ? Math.max(...hours) : 23;
              return forToday[`${maxH}:00`];
            })();
            outsideF = forCurrentHour != null ? forCurrentHour : fallbackHour;
            setCurrentOutsideTempF(outsideF);
          } else {
            setCurrentOutsideTempF(null);
          }
        } catch (weatherErr) {
          console.warn("Outside temp from weather API unavailable, using estimate:", weatherErr);
          if (!cancelled) {
            setExternalTempByHour(null);
            setCurrentOutsideTempF(null);
          }
        }

        const updated =
          current.timestamp ? formatTimestamp(current.timestamp) : "";
        setUpdatedAt(updated);

        saveHomeSnapshot({
          readings: frontendReadings,
          chartData: chart24h,
          chartDateStr: dateStr,
          externalTempByHour: extHour,
          currentOutsideTempF: outsideF,
          updatedAt: updated,
          empty: false,
          todayAlerts: todayAlertsList,
        });
        contentShownRef.current = true;
        lastOkFetchAt = Date.now();
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching data:", err);
        if (!contentShownRef.current) {
          const msg =
            err instanceof Error && err.message
              ? err.message
              : "Failed to load data.";
          setError(
            msg.includes("fetch") || msg.includes("Network")
              ? "Cannot reach the API. Start the backend (npm run dev:backend) and check VITE_API_BASE in .env."
              : msg
          );
        }
      } finally {
        fetchInFlight = false;
        if (!silent && !cancelled) {
          setLoading(false);
        }
      }
    }

    function scheduleSseRefresh() {
      if (sseDebounceTimer != null) {
        clearTimeout(sseDebounceTimer);
      }
      sseDebounceTimer = setTimeout(() => {
        sseDebounceTimer = null;
        fetchData(true);
      }, SSE_DEBOUNCE_MS);
    }

    if (initialSnap) {
      fetchData(true);
    } else {
      fetchData(false);
    }

    const unsubscribe = subscribeReadingUpdates(scheduleSseRefresh);

    const interval = setInterval(() => fetchData(true), HOME_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastOkFetchAt < HOME_POLL_MS) return;
      fetchData(true);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (sseDebounceTimer != null) {
        clearTimeout(sseDebounceTimer);
      }
      unsubscribe();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
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

  if (empty) {
    return (
      <div className="page">
        <div className="center">
          <div className="h1">No sensor data yet</div>
          <div className="smallMuted" style={{ maxWidth: 520, lineHeight: 1.5 }}>
            The backend is up, but there are no temperature rows in the database for the
            configured hive. Load schema if needed (
            <code style={{ fontSize: 12 }}>src/backend/database/database_initial.sql</code>
            ), then insert readings from your pipeline or run{" "}
            <code style={{ fontSize: 12 }}>npm run db:seed</code> for demo points.
          </div>
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
            {readings.internalTemp.toFixed(2)}°F
          </div>
        </div>
      </div>

      <div className="grid2">
        {readings.humidity != null && !Number.isNaN(readings.humidity) ? (
          <GaugeCard
            value={readings.humidity}
            label="Humidity"
            unit="%"
            min={THRESHOLDS_F.humidityPct.min}
            max={THRESHOLDS_F.humidityPct.max}
            ranges={THRESHOLDS_F.humidityPct.ranges}
            decimals={0}
          />
        ) : (
          <div className="gaugeCard" role="status">
            <div className="gaugeCardValue" style={{ color: "var(--text-muted)" }}>
              —
            </div>
            <div className="gaugeCardLabel">Humidity</div>
            <div className="gaugeCardStatus" data-status="gray">
              No humidity data from API yet
            </div>
          </div>
        )}
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
            <span className="hardwareInfoValue">
              {readings.packageLoss != null ? readings.packageLoss : "—"}
            </span>
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
        <h2 id="alerts-heading" className="pageSectionTitle">Today&apos;s alerts</h2>
        <div className="smallMuted" style={{ marginBottom: 12 }}>
          Readings from today (local time) that crossed humidity or temperature thresholds.
        </div>
        <div className="stack">
          {todayAlerts.length === 0 ? (
            <div className="emptyState">
              No threshold alerts yet today — hive looks healthy
            </div>
          ) : (
            todayAlerts.map((a) => (
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