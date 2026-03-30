/* Alerts from computeAlerts(readings); empty state when API returns no rows (getCurrentReading === null). */
import { useState, useEffect } from "react";
import AlertCard from "../components/AlertCard";
import { AlertsSkeleton } from "../components/Skeleton";
import { getCurrentReading } from "../services/api";
import { transformToFrontendFormat } from "../services/dataTransform";
import { computeAlerts } from "../services/alerts";
import { formatTimestamp } from "../utils/conversions";

export default function AlertsScreen() {
  const [readings, setReadings] = useState(null);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        setEmpty(false);
        const current = await getCurrentReading();
        if (current == null) {
          setReadings(null);
          setUpdatedAt("");
          setEmpty(true);
          return;
        }
        setReadings(transformToFrontendFormat(current));
        setUpdatedAt(formatTimestamp(current.timestamp));
      } catch (err) {
        console.error("Error fetching alerts data:", err);
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

  const alerts = readings ? computeAlerts(readings) : [];

  return (
    <div className="page">
      <div className="center">
        <div className="h1" style={{ fontSize: 18 }}>Activity & alerts</div>
        <div className="smallMuted">last updated: {updatedAt}</div>
      </div>

      <div className="yellowPanel">
        <div className="panelTitle">Alerts</div>
        <div className="stack">
          {alerts.length === 0 ? (
            <div className="emptyState">
              No active alerts — hive looks healthy
            </div>
          ) : (
            alerts.map((a) => (
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
      </div>
    </div>
  );
}
