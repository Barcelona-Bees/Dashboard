import { useTheme } from "../context/ThemeContext";

const items = [
  { key: "home", label: "Home" },
  { key: "alerts", label: "Notifications" },
  { key: "data", label: "All Data" },
];

export default function SideMenu({ open, activeTab, onClose, onSelect }) {
  const { theme, toggleTheme } = useTheme();

  if (!open) return null;

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="drawer" role="navigation" aria-label="Menu">
        <div className="drawerPanel">
          {items.map((it) => (
            <button
              key={it.key}
              className={"drawerBtn " + (activeTab === it.key ? "active" : "")}
              onClick={() => onSelect(it.key)}
            >
              {it.label}
            </button>
          ))}
          <div className="themeToggleRow">
            <span className="themeToggleLabel">{theme === "light" ? "☀️ Light" : "🌙 Dark"}</span>
            <button
              type="button"
              className={"toggle " + (theme === "dark" ? "on" : "")}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              aria-pressed={theme === "dark"}
              onClick={toggleTheme}
            />
          </div>
        </div>
      </div>
    </>
  );
}
