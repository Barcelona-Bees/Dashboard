import AlertCard from "../components/AlertCard";
import { fake } from "../data/fake";

export default function AlertsScreen() {
  return (
    <div className="page">
      <div className="center">
        <div className="h1" style={{ fontSize: 18 }}>Activity & alerts</div>
        <div className="smallMuted">last updated: {fake.updatedAt}</div>
      </div>

      <div className="yellowPanel">
        <div className="panelTitle">Alerts</div>
        <div className="stack">
          {fake.alerts.map((a) => (
            <AlertCard
              key={a.id}
              type={a.type}
              text={a.text}
              severity={a.severity}
              time={a.time}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
