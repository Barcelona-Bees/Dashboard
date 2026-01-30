export default function AlertCard({ type, text, severity, time }) {
  return (
    <div className="alertCard">
      <div className="alertRow">
        <span className="alertTitle">{type}</span>
        <span>{time}</span>
      </div>
      <div className="alertText">{text}</div>
      <div className="alertMeta">severity: {severity}</div>
    </div>
  );
}
