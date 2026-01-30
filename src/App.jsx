import { useMemo, useState } from "react";
import Header from "./ui/Header";
import SideMenu from "./ui/SideMenu";

import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import AlertsScreen from "./screens/AlertsScreen";
import DataScreen, { ExportModal } from "./screens/DataScreen";
import AccountScreen from "./screens/AccountScreen";

function getStoredAuth() {
  try {
    return localStorage.getItem("bb_authed") === "1";
  } catch {
    return false;
  }
}

export default function App() {
  const [authed, setAuthed] = useState(getStoredAuth());
  const [activeTab, setActiveTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const screen = useMemo(() => {
    if (!authed) return null;

    switch (activeTab) {
      case "home":
        return <HomeScreen />;
      case "alerts":
        return <AlertsScreen />;
      case "data":
        return <DataScreen onOpenExport={() => setExportOpen(true)} />;
      case "account":
        return <AccountScreen onLogout={() => {
          setAuthed(false);
          try { localStorage.setItem("bb_authed", "0"); } catch {}
          setActiveTab("home");
        }} />;
      default:
        return <HomeScreen />;
    }
  }, [activeTab, authed]);

  const handleLogin = () => {
    setAuthed(true);
    try { localStorage.setItem("bb_authed", "1"); } catch {}
  };

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

        {!authed ? (
          <LoginScreen onLogin={handleLogin} />
        ) : (
          <>
            {screen}
            {exportOpen ? <ExportModal onClose={() => setExportOpen(false)} /> : null}
          </>
        )}
      </div>
    </div>
  );
}
