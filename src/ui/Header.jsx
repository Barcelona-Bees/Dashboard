export default function Header({ onMenu }) {
  return (
    <div className="topBar">
      <button className="hamburger" onClick={onMenu} aria-label="Open menu">☰</button>
      <div className="topTitle">Barcelona Bees</div>
      <div className="logoBadge" aria-label="Logo">BB</div>
    </div>
  );
}
