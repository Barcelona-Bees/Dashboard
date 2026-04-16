import { useState, useEffect, useRef } from "react";
import GaugeCard from "../components/GaugeCard";
import AccessibleLineChart from "../components/AccessibleLineChart";
import AlertCard from "../components/AlertCard";
import { HomeSkeleton } from "../components/Skeleton";
import { THRESHOLDS_F, findRangeForValue } from "../config/thresholds";
import {
  getCurrentReadingAlt,
  getMergedRange,
  getTwoWeeksData,
  subscribeReadingUpdates,
} from "../services/api";
import {
  ALERTS_PAGE_SIZE,
  ALERT_FILTER_OPTIONS,
  collectAlertsFromPoints,
  collectConnectivityGapAlerts,
  filterAlertsByNotification,
  filterPointsInLocalCalendarDay,
} from "../services/alerts";
import {
  EXPECTED_READING_INTERVAL_MINUTES,
  HIVE_OFFLINE_GRACE_MS,
} from "../config/connectivity.js";
import { transformToFrontendFormat, buildRolling24HourChart } from "../services/dataTransform";
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

function estimatePacketLossPctOverActiveSessions(points) {
  if (!Array.isArray(points) || points.length === 0) return null;
  const intervalMs = EXPECTED_READING_INTERVAL_MINUTES * 60 * 1000;
  const times = points
    .map((p) => new Date(p.timestamp).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);
  if (times.length === 0) return null;

  let expectedTotal = 0;
  let receivedTotal = 0;

  let sessionStart = times[0];
  let prev = times[0];
  let slots = new Set([0]);

  function closeSession() {
    const duration = Math.max(0, prev - sessionStart);
    const expected = Math.max(1, Math.floor(duration / intervalMs) + 1);
    const received = Math.min(expected, slots.size);
    expectedTotal += expected;
    receivedTotal += received;
  }

  for (let i = 1; i < times.length; i++) {
    const t = times[i];
    if (t - prev > HIVE_OFFLINE_GRACE_MS) {
      closeSession();
      sessionStart = t;
      prev = t;
      slots = new Set([0]);
      continue;
    }
    const slot = Math.floor((t - sessionStart) / intervalMs);
    slots.add(slot);
    prev = t;
  }
  closeSession();

  if (expectedTotal <= 0) return null;
  const loss = Math.max(0, 1 - receivedTotal / expectedTotal);
  return Math.round(loss * 100);
}

export default function HomeScreen() {
  const contentShownRef = useRef(!!initialSnap);

  const [readings, setReadings] = useState(initialSnap?.readings ?? null);
  const [chartData, setChartData] = useState(initialSnap?.chartData ?? []);
  const [chartDateStr, setChartDateStr] = useState(initialSnap?.chartDateStr ?? null); // YYYY-MM-DD for weather alignment
  const [chartHasWeather, setChartHasWeather] = useState(
    initialSnap?.chartHasWeather ?? !!(initialSnap?.externalTempByHour)
  );
  const [currentOutsideTempF, setCurrentOutsideTempF] = useState(
    initialSnap?.currentOutsideTempF ?? null
  ); // single value for hero when we have weather
  const [updatedAt, setUpdatedAt] = useState(initialSnap?.updatedAt ?? "");
  const [loading, setLoading] = useState(!initialSnap);
  const [error, setError] = useState(null);
  const [empty, setEmpty] = useState(initialSnap?.empty ?? false);
  const [todayAlerts, setTodayAlerts] = useState(initialSnap?.todayAlerts ?? []);
  const [todayAlertsPage, setTodayAlertsPage] = useState(1);
  const [todayNotificationFilter, setTodayNotificationFilter] = useState("all");

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
          setChartHasWeather(false);
          setCurrentOutsideTempF(null);
          setUpdatedAt("");
          setEmpty(true);
          saveHomeSnapshot({
            readings: null,
            chartData: [],
            chartDateStr: null,
            chartHasWeather: false,
            currentOutsideTempF: null,
            updatedAt: "",
            empty: true,
            todayAlerts: [],
          });
          setTodayAlerts([]);
          setTodayAlertsPage(1);
          contentShownRef.current = true;
          lastOkFetchAt = Date.now();
          return;
        }

        const nowMs = Date.now();
        const latestMs = current?.timestamp ? new Date(current.timestamp).getTime() : NaN;
        const hiveOnline = !Number.isNaN(latestMs) && nowMs - latestMs <= HIVE_OFFLINE_GRACE_MS;
        const frontendReadings = transformToFrontendFormat(
          current,
          hiveOnline ? "Connected" : "Hive disconnected"
        );
        frontendReadings.packageLoss = null;
        if (!Number.isNaN(latestMs)) {
          try {
            const end30 = new Date(latestMs);
            const start30 = new Date(end30);
            start30.setDate(start30.getDate() - 30);
            const thirtyDayPoints = await getMergedRange(start30, end30);
            frontendReadings.packageLoss = estimatePacketLossPctOverActiveSessions(
              thirtyDayPoints
            );
          } catch (lossErr) {
            console.warn("30-day packet loss estimate unavailable:", lossErr);
          }
        }
        setReadings(frontendReadings);

        const dateStr = current.timestamp
          ? new Date(current.timestamp).toISOString().split("T")[0]
          : null;
        setChartDateStr(dateStr);

        let weatherMap = null;
        let chartWeatherOk = false;
        let outsideF = null;
        try {
          weatherMap = await getHourlyOutsideTempsByDate();
          if (cancelled) return;
          chartWeatherOk = weatherMap instanceof Map && weatherMap.size > 0;
          setChartHasWeather(chartWeatherOk);

          const now = new Date();
          const todayStr = now.toISOString().split("T")[0];
          const hourLabel = `${now.getHours()}:00`;

          const forToday = buildExternalTempFMapForDate(
            todayStr,
            weatherMap,
            celsiusToFahrenheit
          );
          const hasTodayWeather = Object.keys(forToday).length > 0;

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
            weatherMap = null;
            chartWeatherOk = false;
            setChartHasWeather(false);
            setCurrentOutsideTempF(null);
          }
        }

        const chart24h = buildRolling24HourChart(
          twoWeeks,
          current.timestamp,
          weatherMap,
          celsiusToFahrenheit
        );
        setChartData(chart24h);

        const todayPoints = filterPointsInLocalCalendarDay(twoWeeks, new Date());
        const todayAlertsList = collectAlertsFromPoints(todayPoints);
        const connectivityAll = collectConnectivityGapAlerts(twoWeeks, new Date());
        const todayConnectivity = filterPointsInLocalCalendarDay(
          connectivityAll.map((a) => ({ timestamp: a.readingAt, _alert: a })),
          new Date()
        ).map((p) => p._alert);
        const todayWithConnectivity = [...todayConnectivity, ...todayAlertsList].sort(
          (a, b) => new Date(b.readingAt).getTime() - new Date(a.readingAt).getTime()
        );
        setTodayAlerts(todayWithConnectivity);
        setTodayAlertsPage(1);

        const updated =
          current.timestamp ? formatTimestamp(current.timestamp) : "";
        setUpdatedAt(updated);

        saveHomeSnapshot({
          readings: frontendReadings,
          chartData: chart24h,
          chartDateStr: dateStr,
          chartHasWeather: chartWeatherOk,
          currentOutsideTempF: outsideF,
          updatedAt: updated,
          empty: false,
          todayAlerts: todayWithConnectivity,
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
        <div className="pageHead">
          <h1 className="pageTitle" style={{ color: "var(--danger)" }}>Error</h1>
          <p className="pageMeta">{error}</p>
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="page">
        <div className="pageHead">
          <h1 className="pageTitle">No sensor data yet</h1>
          <p className="pageMeta" style={{ maxWidth: "32rem", marginLeft: "auto", marginRight: "auto" }}>
            The backend is up, but there are no temperature rows in the database for the
            configured hive. Load schema if needed (
            <code className="inlineCode">src/backend/database/database_initial.sql</code>
            ), then insert readings from your pipeline or run{" "}
            <code className="inlineCode">npm run db:seed</code> for demo points.
          </p>
        </div>
      </div>
    );
  }

  if (!readings) return null;

  const insideTempBand = findRangeForValue(
    readings.internalTemp,
    THRESHOLDS_F.internalTempF.ranges
  );

  const filteredTodayAlerts = filterAlertsByNotification(todayAlerts, todayNotificationFilter);
  const todayTotalPages = Math.max(1, Math.ceil(filteredTodayAlerts.length / ALERTS_PAGE_SIZE));
  const safeTodayPage = Math.min(Math.max(1, todayAlertsPage), todayTotalPages);
  const todayAlertsSlice = filteredTodayAlerts.slice(
    (safeTodayPage - 1) * ALERTS_PAGE_SIZE,
    safeTodayPage * ALERTS_PAGE_SIZE
  );

  return (
    <div className="page">
      <header className="pageHead">
        <h1 className="pageTitle">Current readings</h1>
        <p className="pageMeta">Last updated · {updatedAt}</p>
      </header>

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
          <div
            className="heroMetricBand"
            data-tier={insideTempBand?.color ?? "gray"}
          >
            {insideTempBand?.label ?? "—"}
          </div>
        </div>
      </div>

      <div className="gaugeSingleWrap">
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

      <aside
        className="thresholdTip"
        aria-label="How humidity and temperature bands are interpreted"
      >
        Humidity is usually healthiest around 50–60% RH, while sustained high humidity can raise
        condensation risk. Temperature guidance is based on typical brood-area ranges (~93–95°F),
        but readings will vary by season and sensor placement.
      </aside>

      <section className="pageSection" aria-labelledby="hardware-heading">
        <h2 id="hardware-heading" className="pageSectionTitle">Hardware</h2>
        <div className="hardwareInfoRow">
          <div className="hardwareInfoCard" aria-label="Connection status">
            <span className="hardwareInfoLabel">Connection</span>
            <span className="hardwareInfoValue">{readings.connectionStatus}</span>
          </div>
          <div className="hardwareInfoCard" aria-label="Package loss">
            <span className="hardwareInfoLabel">Packet loss (30d active sessions)</span>
            <span className="hardwareInfoValue">
              {readings.packageLoss != null ? `${readings.packageLoss}%` : "—"}
            </span>
            <span className="hardwareInfoLabel">
              Excludes long offline/unhooked gaps (&gt;30m)
            </span>
          </div>
        </div>
      </section>

      <section className="pageSection" aria-labelledby="chart-heading">
        <h2 id="chart-heading" className="pageSectionTitle">Temperature comparison</h2>
        <div className="chartFrame">
          <AccessibleLineChart
            title="Inside vs outside temperature (last 24 hours)"
            data={chartData.map((p) => ({
              xLabel: p.xLabel ?? p.t,
              internalTemp: p.internalTempF,
              externalTemp: p.externalTempF ?? null,
            }))}
            xLabelKey="xLabel"
            series={[
              { key: "internalTemp", name: "Inside hive (°F)" },
              { key: "externalTemp", name: "Outside (°F)" },
            ]}
          />
          <div className="chartCaption">
            This chart shows the last 24 hours up to the most recent hive reading. If part of the
            inside line is missing, we didn&apos;t receive data for that hour.{" "}
            {chartHasWeather
              ? "Outside temperature comes from Open-Meteo for Rochester, with a fallback estimate only when weather data is unavailable."
              : "Outside temperature is estimated from inside because weather data is currently unavailable."}
          </div>
        </div>
      </section>

      <section className="pageSection" aria-labelledby="alerts-heading">
        <h2 id="alerts-heading" className="pageSectionTitle">Today&apos;s alerts</h2>
        <p className="pageSectionLead">
          These are today&apos;s threshold alerts based on your local time.
        </p>
        <div className="alertFilters">
          <label htmlFor="home-alerts-filter-select" className="alertFiltersLabel">
            Filter notifications
          </label>
          <select
            id="home-alerts-filter-select"
            className="alertFilterSelect"
            value={todayNotificationFilter}
            onChange={(e) => {
              setTodayNotificationFilter(e.target.value);
              setTodayAlertsPage(1);
            }}
          >
            {ALERT_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="stack">
          {filteredTodayAlerts.length === 0 ? (
            <div className="emptyState">
              {todayAlerts.length === 0
                ? "No threshold alerts yet today — hive looks healthy"
                : "No notifications match this filter."}
            </div>
          ) : (
            todayAlertsSlice.map((a) => (
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
        {filteredTodayAlerts.length > ALERTS_PAGE_SIZE ? (
          <nav className="paginationBar" aria-label="Today's alerts pages">
            <button
              type="button"
              className="exportBtn"
              disabled={safeTodayPage <= 1}
              onClick={() => setTodayAlertsPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="paginationInfo">
              Page {safeTodayPage} of {todayTotalPages}
            </span>
            <button
              type="button"
              className="exportBtn"
              disabled={safeTodayPage >= todayTotalPages}
              onClick={() =>
                setTodayAlertsPage((p) => Math.min(todayTotalPages, p + 1))
              }
            >
              Next
            </button>
          </nav>
        ) : null}
      </section>
    </div>
  );
}