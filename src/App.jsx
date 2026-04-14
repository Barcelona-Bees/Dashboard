import { useEffect, useMemo, useState } from "react";
import Header from "./ui/Header";
import AppFooter from "./ui/AppFooter";
import SideMenu from "./ui/SideMenu";

import HomeScreen from "./screens/HomeScreen";
import AlertsScreen from "./screens/AlertsScreen";
import DataScreen, { ExportModal } from "./screens/DataScreen";
import { getCurrentReadingAlt, subscribeReadingUpdates } from "./services/api";
import { HIVE_OFFLINE_GRACE_MS } from "./config/connectivity.js";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportRows, setExportRows] = useState(null);
  const [lastReadingAt, setLastReadingAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function refreshLatest() {
      const latest = await getCurrentReadingAlt();
      if (cancelled) return;
      if (latest?.timestamp) setLastReadingAt(String(latest.timestamp));
    }

    refreshLatest();
    const unsub = subscribeReadingUpdates(refreshLatest);
    const poll = setInterval(refreshLatest, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      unsub();
      clearInterval(poll);
    };
  }, []);

  const hiveOnline = (() => {
    if (!lastReadingAt) return false;
    const ms = new Date(lastReadingAt).getTime();
    if (Number.isNaN(ms)) return false;
    return Date.now() - ms <= HIVE_OFFLINE_GRACE_MS;
  })();

  const screen = useMemo(() => {
    switch (activeTab) {
      case "home":
        return <HomeScreen />;
      case "alerts":
        return <AlertsScreen />;
      case "data":
        return (
          <DataScreen
            onOpenExport={(rows) => {
              setExportRows(rows);
              setExportOpen(true);
            }}
          />
        );
      default:
        return <HomeScreen />;
    }
  }, [activeTab]);

  return (
    <div className="outer">
      <a
        href="#main-content"
        className="skipLink"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById("main-content");
          el?.focus({ preventScroll: false });
          el?.scrollIntoView({ block: "start", behavior: "smooth" });
        }}
      >
        Skip to main content
      </a>
      <div className="appShell">
        <Header
          menuOpen={menuOpen}
          onMenu={() => setMenuOpen(true)}
          onHome={() => {
            setActiveTab("home");
            setMenuOpen(false);
          }}
          hiveOnline={hiveOnline}
        />
        <SideMenu
          open={menuOpen}
          activeTab={activeTab}
          onClose={() => setMenuOpen(false)}
          onSelect={(tab) => {
            setActiveTab(tab);
            setMenuOpen(false);
          }}
        />

        <main id="main-content" className="appMain" tabIndex={-1}>
          {screen}
          {exportOpen ? (
            <ExportModal
              rows={exportRows}
              onClose={() => {
                setExportOpen(false);
                setExportRows(null);
              }}
            />
          ) : null}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
