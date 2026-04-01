/* Historical alerts: merged readings over ALERT_HISTORY_DAYS, threshold replay, paginated. */
import { useState, useEffect, useRef } from "react";
import AlertCard from "../components/AlertCard";
import { AlertsSkeleton } from "../components/Skeleton";
import { getMergedRange } from "../services/api";
import { collectAlertsFromPoints, ALERT_HISTORY_DAYS } from "../services/alerts";
import { formatTimestamp } from "../utils/conversions";
import { loadAlertsSnapshot, saveAlertsSnapshot } from "../services/alertsCache";

const PAGE_SIZE = 15;

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
        setHistoricalAlerts(list);
        const ts = formatTimestamp(end.toISOString());
        setUpdatedAt(ts);
        setEmpty(false);
        saveAlertsSnapshot({
          historicalAlerts: list,
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
        <div className="center">
          <div className="h1" style={{ color: "var(--danger)" }}>Error</div>
          <div className="smallMuted">{error}</div>
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="page">
        <div className="center">
          <div className="h1" style={{ fontSize: 18 }}>No readings</div>
          <div className="smallMuted">
            Add temperature data to the database or run <code>npm run db:seed</code>.
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(historicalAlerts.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageSlice = historicalAlerts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <div className="page">
      <div className="center">
        <div className="h1" style={{ fontSize: 18 }}>Activity & alerts</div>
        <div className="smallMuted">
          Threshold crossings in the last {ALERT_HISTORY_DAYS} days · last refreshed:{" "}
          {updatedAt}
        </div>
      </div>

      <div className="yellowPanel">
        <div className="panelTitle">Alert history</div>
        <div className="stack">
          {historicalAlerts.length === 0 ? (
            <div className="emptyState">
              No threshold alerts in the last {ALERT_HISTORY_DAYS} days — hive looks
              healthy
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

        {historicalAlerts.length > PAGE_SIZE ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginTop: 16,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="exportBtn"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="smallMuted">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              className="exportBtn"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
