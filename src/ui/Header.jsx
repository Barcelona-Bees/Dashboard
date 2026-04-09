export default function Header({ onMenu, menuOpen }) {
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

      <div className="topBarCenter">
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
          <span className="brandSubtitle">Beehive monitoring system</span>
        </div>
      </div>

      <div className="topBarRight">
        <span className="hiveStatus">
          <span className="hiveStatusDot" aria-hidden="true" />
          Hive online
        </span>
        <div className="logoBadge" aria-hidden="true" title="Barcelona Bees">
          <img className="logoBadgeImg" src="/favicon.svg" alt="" width={32} height={32} decoding="async" />
        </div>
      </div>
    </header>
  );
}
