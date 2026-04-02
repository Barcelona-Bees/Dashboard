export default function AlertCard({ type, text, severity, time }) {
  return (
    <article className="alertCard" data-severity={severity} aria-label={`${type} alert`}>
      <div className="alertRow">
        <span className="alertTitle">{type}</span>
        <span>{time}</span>
      </div>
      <div className="alertText">{text}</div>
      <div className="alertMeta">severity: {severity}</div>
    </article>
  );
}
