/* Historical alerts: merged readings over ALERT_HISTORY_DAYS, threshold replay, paginated. */
import { useState, useEffect, useRef } from "react";
import AlertCard from "../components/AlertCard";
import { AlertsSkeleton } from "../components/Skeleton";
import { getMergedRange } from "../services/api";
import {
  collectAlertsFromPoints,
  collectConnectivityGapAlerts,
  ALERT_HISTORY_DAYS,
  ALERTS_PAGE_SIZE,
  ALERT_FILTER_OPTIONS,
  filterAlertsByNotification,
} from "../services/alerts";
import { formatTimestamp } from "../utils/conversions";
import { loadAlertsSnapshot, saveAlertsSnapshot } from "../services/alertsCache";

const initialSnap = typeof window !== "undefined" ? loadAlertsSnapshot() : null;

const hasCachedHistory = Array.isArray(initialSnap?.historicalAlerts);

export default function AlertsScreen() {
  const contentShownRef = useRef(hasCachedHistory);

  const [historicalAlerts, setHistoricalAlerts] = useState(
    hasCachedHistory ? initialSnap.historicalAlerts : []
  );
  const [updatedAt, setUpdatedAt] = useState(initialSnap?.updatedAt ?? "");
  const [loading, setLoading] = useState(!hasCachedHistory);
  const [error, setError] = useState(null);
  const [empty, setEmpty] = useState(
    Boolean(initialSnap?.empty) && hasCachedHistory
  );
  const [page, setPage] = useState(1);
  const [notificationFilter, setNotificationFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function fetchData(silent = false) {
      try {
        if (!silent) {
          setLoading(true);
        }
        setError(null);
        setEmpty(false);

        const end = new Date();
        const start = new Date(end);
        start.setDate(start.getDate() - ALERT_HISTORY_DAYS);

        const points = await getMergedRange(start, end);
        if (cancelled) return;

        if (points.length === 0) {
          setHistoricalAlerts([]);
          setUpdatedAt("");
          setEmpty(true);
          saveAlertsSnapshot({
            historicalAlerts: [],
            updatedAt: "",
            empty: true,
          });
          contentShownRef.current = true;
          setPage(1);
          return;
        }

        const list = collectAlertsFromPoints(points);
        const connectivity = collectConnectivityGapAlerts(points, end);
        const withConnectivity = [...connectivity, ...list].sort(
          (a, b) => new Date(b.readingAt).getTime() - new Date(a.readingAt).getTime()
        );
        setHistoricalAlerts(withConnectivity);
        const ts = formatTimestamp(end.toISOString());
        setUpdatedAt(ts);
        setEmpty(false);
        saveAlertsSnapshot({
          historicalAlerts: withConnectivity,
          updatedAt: ts,
          empty: false,
        });
        contentShownRef.current = true;
        setPage(1);
      } catch (err) {
        if (cancelled) return;
        console.error("Error fetching alerts data:", err);
        if (!contentShownRef.current) {
          const msg = err instanceof Error ? err.message : "";
          setError(
            msg.includes("fetch") || msg.includes("Network")
              ? "Cannot reach the API. Start the backend and check VITE_API_BASE."
              : msg || "Request failed."
          );
        }
      } finally {
        if (!silent && !cancelled) {
          setLoading(false);
        }
      }
    }

    if (hasCachedHistory) {
      fetchData(true);
    } else {
      fetchData(false);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <AlertsSkeleton />;
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
          <h1 className="pageTitle">No readings</h1>
          <p className="pageMeta">
            Add temperature data to the database or run{" "}
            <code className="inlineCode">npm run db:seed</code>.
          </p>
        </div>
      </div>
    );
  }

  const filteredAlerts = filterAlertsByNotification(historicalAlerts, notificationFilter);
  const filteredTotalPages = Math.max(1, Math.ceil(filteredAlerts.length / ALERTS_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), filteredTotalPages);
  const pageSlice = filteredAlerts.slice(
    (safePage - 1) * ALERTS_PAGE_SIZE,
    safePage * ALERTS_PAGE_SIZE
  );

  return (
    <div className="page">
      <header className="pageHead">
        <h1 className="pageTitle">Activity &amp; alerts</h1>
        <p className="pageMeta">
          Threshold crossings in the last {ALERT_HISTORY_DAYS} days · refreshed {updatedAt}
        </p>
      </header>

      <div className="panelHistory">
        <h2 className="panelHistoryTitle">Alert history</h2>
        <div className="alertFilters">
          <label htmlFor="alerts-filter-select" className="alertFiltersLabel">
            Filter notifications
          </label>
          <select
            id="alerts-filter-select"
            className="alertFilterSelect"
            value={notificationFilter}
            onChange={(e) => {
              setNotificationFilter(e.target.value);
              setPage(1);
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
          {filteredAlerts.length === 0 ? (
            <div className="emptyState">
              {historicalAlerts.length === 0
                ? `No threshold alerts in the last ${ALERT_HISTORY_DAYS} days — hive looks healthy`
                : "No notifications match this filter."}
            </div>
          ) : (
            pageSlice.map((a) => (
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

        {filteredAlerts.length > ALERTS_PAGE_SIZE ? (
          <nav className="paginationBar" aria-label="Alert history pages">
            <button
              type="button"
              className="exportBtn"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="paginationInfo">
              Page {safePage} of {filteredTotalPages}
            </span>
            <button
              type="button"
              className="exportBtn"
              disabled={safePage >= filteredTotalPages}
              onClick={() => setPage((p) => Math.min(filteredTotalPages, p + 1))}
            >
              Next
            </button>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
