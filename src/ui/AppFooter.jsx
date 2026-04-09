export default function AppFooter() {
  return (
    <footer className="appFooter" role="contentinfo">
      <div className="appFooterInner">
        <p className="appFooterTagline">
          <span className="appFooterIcon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          Smart insights. Healthy hives. Better decisions.
        </p>
        <p className="appFooterIoT">
          <span>IOT FOR HEALTHY HIVES</span>
          <span className="appFooterWifi" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5 12.55a11 11 0 0 1 14.08 0"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M8.53 16.11a6 6 0 0 1 6.95 0"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M12 20h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </p>
      </div>
    </footer>
  );
}
