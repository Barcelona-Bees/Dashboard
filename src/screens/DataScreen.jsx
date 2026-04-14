/* Historical charts: 14 local calendar days from merged /temp/range + /Humidity/range. */
import Modal from "../ui/Modal";
import { DataSkeleton } from "../components/Skeleton";
import { useState, useEffect } from "react";
import AccessibleLineChart from "../components/AccessibleLineChart";
import { getMergedFourteenDayLocalWindow } from "../services/api";
import {
  build14DayOverviewSeries,
  withFourteenDayTrendOverlay,
} from "../services/dataTransform";
import { DATA_OVERVIEW_DAYS } from "../config/readingsWindow.js";
import { formatTimestamp } from "../utils/conversions";
import {
  buildExportPayload,
  defaultExportFilename,
  exportCsv,
  exportJson,
  exportXlsx,
  openPrintableTable,
} from "../services/exportReadings";

export default function DataScreen({ onOpenExport }) {
  const [seriesData, setSeriesData] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const data = await getMergedFourteenDayLocalWindow();
        setRawRows(Array.isArray(data) ? data : []);
        const formatted = build14DayOverviewSeries(data);
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
        <div className="pageHead">
          <h1 className="pageTitle" style={{ color: "var(--danger)" }}>Error</h1>
          <p className="pageMeta">{error}</p>
        </div>
      </div>
    );
  }

  const hasHumidity = seriesData.some((p) => p.humidity != null);
  const hasTemperature = seriesData.some((p) => p.temperature != null);
  const chartRows = withFourteenDayTrendOverlay(seriesData);

  return (
    <div className="page">
      <div className="dataTopRow">
        <header className="pageHead">
          <h1 className="pageTitle">{DATA_OVERVIEW_DAYS}-day overview</h1>
          <p className="pageMeta">
            Last {DATA_OVERVIEW_DAYS} local calendar days. Charts show daily averages with a
            smoothed line for readability; export files always contain the raw readings. Last
            sample · {updatedAt}
          </p>
        </header>
        <button
          type="button"
          className="exportBtn exportBtn--brand"
          onClick={() => onOpenExport(rawRows)}
          disabled={rawRows.length === 0}
        >
          Export
        </button>
      </div>

      <div className="dataGrid">
          <div className="chartFrame chartFrame--temp">
            <div className="chartFrameHead">
              <span className="chartFrameIcon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 3v10M9 6h6M8 15h8a2 2 0 0 1 2 2v1H6v-1a2 2 0 0 1 2-2z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="chartFrameTitle">Temperature (°F)</span>
            </div>
            {hasTemperature ? (
              <AccessibleLineChart
                title=""
                data={chartRows}
                xLabelKey="xLabel"
                series={[{ key: "temperatureForChart", name: "Temperature (°F)" }]}
                seriesColors={["var(--chart-series-temp)"]}
              />
            ) : (
              <div className="emptyState" style={{ padding: 24 }}>
                No temperature readings in the last {DATA_OVERVIEW_DAYS} local calendar days.
              </div>
            )}
          </div>

          <div className="chartFrame chartFrame--hum">
            {hasHumidity ? (
              <>
                <div className="chartFrameHead">
                  <span className="chartFrameIcon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 3c-2 3-4 5.5-4 9a4 4 0 0 0 8 0c0-3.5-2-6-4-9z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="chartFrameTitle">Humidity (%)</span>
                </div>
                <AccessibleLineChart
                  title=""
                  data={chartRows}
                  xLabelKey="xLabel"
                  series={[{ key: "humidityForChart", name: "Humidity (%)" }]}
                  seriesColors={["var(--chart-series-hum)"]}
                />
              </>
            ) : (
              <div className="emptyState" style={{ padding: 24 }}>
                No humidity history in this range — upload humidity or ensure
                /Humidity/range returns rows for the same window.
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

export function ExportModal({ rows, onClose }) {
  const [temp, setTemp] = useState(true);
  const [humidity, setHumidity] = useState(true);
  const [format, setFormat] = useState("csv");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const canExport =
    Array.isArray(rows) &&
    rows.length > 0 &&
    (temp || humidity);

  async function handleExport() {
    setErr(null);
    if (!canExport) {
      setErr("Select at least one column (temperature and/or humidity).");
      return;
    }
    const payload = buildExportPayload(rows, { temp, humidity });
    if (payload.columns.length <= 1) {
      setErr("Choose temperature and/or humidity to export.");
      return;
    }

    setBusy(true);
    try {
      const stem = "barcelona-bees-readings";
      switch (format) {
        case "csv":
          exportCsv(payload, defaultExportFilename(stem, "csv"));
          break;
        case "json":
          exportJson(payload, defaultExportFilename(stem, "json"));
          break;
        case "xlsx":
          await exportXlsx(payload, defaultExportFilename(stem, "xlsx"));
          break;
        case "pdf":
          if (!openPrintableTable(payload, "Barcelona Bees — readings export")) {
            setErr("Pop-up blocked. Allow pop-ups for this site to print / save as PDF.");
            setBusy(false);
            return;
          }
          break;
        default:
          break;
      }
      onClose();
    } catch (e) {
      console.error(e);
      setErr(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} ariaLabelledBy="export-modal-title">
      <h2 id="export-modal-title" className="modalTitle">
        Export data
      </h2>
      <p className="modalLead" id="export-modal-desc">
        Download all merged temperature and humidity readings from the same{" "}
        {DATA_OVERVIEW_DAYS}-day window shown above, including each recorded sample (about every
        10 minutes) for analysis.
      </p>

      <div className="modalRow">
        <span className="modalFieldLabel" id="export-columns-label">
          Columns
        </span>
        <div
          className="modalChecks"
          role="group"
          aria-labelledby="export-columns-label"
        >
          <label htmlFor="export-col-temp">
            <input
              id="export-col-temp"
              type="checkbox"
              checked={temp}
              onChange={(e) => setTemp(e.target.checked)}
            />{" "}
            Temperature (°F)
          </label>
          <label htmlFor="export-col-humidity">
            <input
              id="export-col-humidity"
              type="checkbox"
              checked={humidity}
              onChange={(e) => setHumidity(e.target.checked)}
            />{" "}
            Humidity (%)
          </label>
        </div>
      </div>

      <div className="modalRow">
        <label className="modalFieldLabel" htmlFor="export-format">
          File type
        </label>
        <select
          id="export-format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          <option value="csv">CSV (UTF-8, opens in Excel)</option>
          <option value="json">JSON</option>
          <option value="xlsx">Excel (.xlsx)</option>
          <option value="pdf">PDF (opens print view — Save as PDF)</option>
        </select>
      </div>

      {err ? (
        <div id="export-modal-error" className="modalError" role="alert" aria-live="polite">
          {err}
        </div>
      ) : null}

      <div className="modalActions">
        <button type="button" className="modalBtnSecondary" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={!canExport || busy}
          aria-busy={busy}
          aria-describedby={err ? "export-modal-error" : "export-modal-desc"}
        >
          {busy ? "Working…" : "Download"}
        </button>
      </div>
    </Modal>
  );
}
