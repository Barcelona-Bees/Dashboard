import { useMemo, useState } from "react";
import Header from "./ui/Header";
import AppFooter from "./ui/AppFooter";
import SideMenu from "./ui/SideMenu";

import HomeScreen from "./screens/HomeScreen";
import AlertsScreen from "./screens/AlertsScreen";
import DataScreen, { ExportModal } from "./screens/DataScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportRows, setExportRows] = useState(null);

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
        <Header menuOpen={menuOpen} onMenu={() => setMenuOpen(true)} />
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
