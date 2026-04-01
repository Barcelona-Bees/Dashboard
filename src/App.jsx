import { useMemo, useState } from "react";
import Header from "./ui/Header";
import SideMenu from "./ui/SideMenu";

import HomeScreen from "./screens/HomeScreen";
import AlertsScreen from "./screens/AlertsScreen";
import DataScreen, { ExportModal } from "./screens/DataScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const screen = useMemo(() => {
    switch (activeTab) {
      case "home":
        return <HomeScreen />;
      case "alerts":
        return <AlertsScreen />;
      case "data":
        return <DataScreen onOpenExport={() => setExportOpen(true)} />;
      default:
        return <HomeScreen />;
    }
  }, [activeTab]);

  return (
    <div className="outer">
      <div className="appShell">
        <Header onMenu={() => setMenuOpen(true)} />
        <SideMenu
          open={menuOpen}
          activeTab={activeTab}
          onClose={() => setMenuOpen(false)}
          onSelect={(tab) => {
            setActiveTab(tab);
            setMenuOpen(false);
          }}
        />

        <>
          {screen}
          {exportOpen ? <ExportModal onClose={() => setExportOpen(false)} /> : null}
        </>
      </div>
    </div>
  );
}
