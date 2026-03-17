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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const current = await getCurrentReading();
        setReadings(transformToFrontendFormat(current));
        setUpdatedAt(formatTimestamp(current.timestamp));
      } catch (err) {
        console.error("Error fetching alerts data:", err);
        setError("Failed to load data. Please check if the backend server is running.");
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
