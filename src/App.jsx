import { useMemo, useState } from "react";
import Header from "./ui/Header";
import SideMenu from "./ui/SideMenu";

import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import AlertsScreen from "./screens/AlertsScreen";
import DataScreen, { ExportModal } from "./screens/DataScreen";
import AccountScreen from "./screens/AccountScreen";
import RegisterScreen from "./screens/RegisterScreen";
import { clearToken, isLoggedIn } from "./services/auth";

/**
 * Initial auth state is based on whether we already have a JWT token.
 * This lets the user stay logged in across page refreshes.
 */
function getStoredAuth() {
  return isLoggedIn();
}

export default function App() {
  const [authed, setAuthed] = useState(getStoredAuth());
  const [activeTab, setActiveTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  // Simple toggle between login and register views.
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"

  /**
   * Decide which main screen to show when the user is logged in.
   * These are the "protected" sections of the app.
   */
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
        return (
          <AccountScreen
            onLogout={() => {
              // Clear both React state and the stored token when logging out.
              clearToken();
              setAuthed(false);
              setActiveTab("home");
              setAuthMode("login");
            }}
          />
        );
      default:
        return <HomeScreen />;
    }
  }, [activeTab, authed]);

  /**
   * Called after a successful login or registration.
   * At this point the token has already been saved by the auth service.
   */
  const handleAuthSuccess = () => {
    setAuthed(true);
    setActiveTab("home");
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
          authMode === "login" ? (
            <LoginScreen
              onLoginSuccess={handleAuthSuccess}
              onSwitchToRegister={() => setAuthMode("register")}
            />
          ) : (
            <RegisterScreen
              onRegisterSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setAuthMode("login")}
            />
          )
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

