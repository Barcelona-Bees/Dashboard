import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const items = [
  { key: "home", label: "Home" },
  { key: "alerts", label: "Notifications" },
  { key: "data", label: "All Data" },
];

export default function SideMenu({ open, activeTab, onClose, onSelect }) {
  const { theme, toggleTheme } = useTheme();
  const firstNavRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && firstNavRef.current) {
      firstNavRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="backdrop" aria-hidden="true" onClick={onClose} />
      <div
        id="main-menu"
        className="drawer"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="drawerPanel">
          {items.map((it, i) => (
            <button
              key={it.key}
              type="button"
              ref={i === 0 ? firstNavRef : undefined}
              className={"drawerBtn " + (activeTab === it.key ? "active" : "")}
              aria-current={activeTab === it.key ? "page" : undefined}
              onClick={() => onSelect(it.key)}
            >
              {it.label}
            </button>
          ))}
          <div className="themeToggleRow">
            <span className="themeToggleLabel" id="theme-toggle-label">
              {theme === "light" ? "Light theme" : "Dark theme"}
            </span>
            <button
              type="button"
              className={"toggle " + (theme === "dark" ? "on" : "")}
              aria-labelledby="theme-toggle-label"
              aria-pressed={theme === "dark"}
              onClick={toggleTheme}
            />
          </div>
        </div>
      </div>
    </>
  );
}
