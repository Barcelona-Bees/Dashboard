import { useState } from "react";
import { fake } from "../data/fake";

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

  return (
    <div className="page">
      <div className="profileCard">
        <div className="avatar" aria-label="Profile avatar">KB</div>

        <div className="profileName">Kimberly<br />Bee</div>

        <div className="profileEmailWrap">
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 4 }}>Email:</div>
          <input value="kimberlybee@gmail.com" readOnly />
        </div>

        <Toggle label="Notifications:" value={notif} onChange={setNotif} />
        <Toggle label="Texts On:" value={texts} onChange={setTexts} />
        <Toggle label="Emails On:" value={emails} onChange={setEmails} />

        <div className="statsRow">
          <div className="statBox statGreen">
            97%
            <small>Battery Health</small>
          </div>
          <div className="statBox statYellow">
            {fake.readings.packageLoss}
            <small>Packet Loss</small>
          </div>
          <div className="statBox statBlue">
            1
            <small>Active Sensors</small>
          </div>
        </div>

        <span className="linkBtn">Reset password</span>
        <span className="linkBtn" onClick={onLogout}>Logout</span>

        <div className="danger">Delete Account</div>
      </div>
    </div>
  );
}
