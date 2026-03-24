import { useState } from "react";
import { fake } from "../data/fake";
import { getUserProfile } from "../services/auth";

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

/** Two-letter avatar from email local part (e.g. kim.bee@x → KB). */
function avatarInitials(email) {
  if (!email) return "?";
  const local = email.split("@")[0] || "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const s = local.slice(0, 2) || "?";
  return s.toUpperCase();
}

/**
 * Split "display name" from email for the two-line header.
 * e.g. kimberly.bee@… → ["Kimberly", "Bee"]  ;  cb@… → ["Cb"] (one line)
 */
function namePartsFromEmail(email) {
  if (!email) return ["Your account"];
  const local = email.split("@")[0] || "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (!parts.length) {
    return [local || "Your account"];
  }
  const titled = parts.map(
    (p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
  );
  if (titled.length === 1) return [titled[0]];
  return [titled[0], titled.slice(1).join(" ")];
}

export default function AccountScreen({ onLogout }) {
  const [notif, setNotif] = useState(true);
  const [texts, setTexts] = useState(true);
  const [emails, setEmails] = useState(true);

  // Read fresh each time this screen renders (e.g. after switching tabs back to Account).
  const profile = getUserProfile();
  const userEmail = profile?.email ?? "";
  const initials = avatarInitials(userEmail);
  const nameParts = namePartsFromEmail(userEmail);

  return (
    <div className="page">
      <div className="profileCard">
        <div className="avatar" aria-label="Profile avatar">
          {initials}
        </div>

        <div className="profileName">
          {nameParts[0]}
          {nameParts[1] ? (
            <>
              <br />
              {nameParts[1]}
            </>
          ) : null}
        </div>

        <div className="profileEmailWrap">
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 4 }}>
            Email:
          </div>
          <input
            value={userEmail || "—"}
            readOnly
            title={userEmail || "No email stored — try logging out and back in"}
          />
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
        <span className="linkBtn" onClick={onLogout}>
          Logout
        </span>

        <div className="danger">Delete Account</div>
      </div>
    </div>
  );
}
