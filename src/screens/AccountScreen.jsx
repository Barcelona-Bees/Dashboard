import { useState, useEffect } from "react";
import { getCurrentReading } from "../services/api";
import { transformToFrontendFormat } from "../services/dataTransform";

function Toggle({ value, onChange, label }) {
  return (
    <div className="toggleRow">
      <div style={{ fontWeight: 800 }}>{label}</div>
      <div
        className={"toggle " + (value ? "on" : "")}
        role="switch"
        aria-checked={value}
        tabIndex={0}
        onClick={() => onChange(!value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onChange(!value);
        }}
      />
    </div>
  );
}

export default function AccountScreen({ onLogout }) {
  const [notif, setNotif] = useState(true);
  const [texts, setTexts] = useState(true);
  const [emails, setEmails] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const point = await getCurrentReading();
        if (!cancelled) {
          setSummary(point ? transformToFrontendFormat(point) : null);
        }
      } catch {
        if (!cancelled) setSummary(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <div className="profileCard">
        <div className="avatar" aria-label="Profile avatar">
          KB
        </div>

        <div className="profileName">
          Kimberly
          <br />
          Bee
        </div>

        <div className="profileEmailWrap">
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 4 }}>
            Email:
          </div>
          <input value="kimberlybee@gmail.com" readOnly />
        </div>

        <Toggle label="Notifications:" value={notif} onChange={setNotif} />
        <Toggle label="Texts On:" value={texts} onChange={setTexts} />
        <Toggle label="Emails On:" value={emails} onChange={setEmails} />

        <div className="statsRow">
          <div className="statBox statGreen">
            {summary?.batteryPct != null ? `${summary.batteryPct}%` : "—"}
            <small>Battery Health</small>
          </div>
          <div className="statBox statYellow">
            {summary?.packageLoss != null ? summary.packageLoss : "—"}
            <small>Packet Loss</small>
          </div>
          <div className="statBox statBlue">
            —
            <small>Active Sensors</small>
          </div>
        </div>

        <span className="linkBtn">Reset password</span>
        <span className="linkBtn" onClick={onLogout}>
          Logout
        </span>

        <div className="danger">Delete Account</div>
      </div>
    </div>
  );
}
