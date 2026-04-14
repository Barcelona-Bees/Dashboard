export default function Header({ onMenu, menuOpen, onHome, hiveOnline }) {
  return (
    <header className="topBar" role="banner">
      <button
        type="button"
        className="hamburger"
        onClick={onMenu}
        aria-label="Menu"
        aria-expanded={Boolean(menuOpen)}
        aria-controls="main-menu"
      >
        ☰
      </button>

      <button
        type="button"
        className="topBarCenter"
        onClick={onHome}
        aria-label="Go to Home"
        style={{ background: "transparent", border: "none", cursor: "pointer" }}
      >
        <div className="brandMark">
          <img
            className="brandMarkImg"
            src="/pwa-small.svg"
            alt=""
            width={40}
            height={40}
            decoding="async"
          />
        </div>
        <div className="brandText">
          <span className="brandTitle">Barcelona Bees</span>
          <span className="brandSubtitle">BeeBuddy monitoring system</span>
        </div>
      </button>

      <div className="topBarRight">
        <span className="hiveStatus" data-status={hiveOnline ? "online" : "offline"}>
          <span className="hiveStatusDot" aria-hidden="true" />
          {hiveOnline ? "Hive online" : "Hive offline"}
        </span>
        <div className="logoBadge" aria-hidden="true" title="Barcelona Bees">
          <img className="logoBadgeImg" src="/favicon.svg" alt="" width={32} height={32} decoding="async" />
        </div>
      </div>
    </header>
  );
}
