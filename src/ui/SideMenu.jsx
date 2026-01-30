const items = [
  { key: "home", label: "Home" },
  { key: "alerts", label: "Notifications" },
  { key: "data", label: "All Data" },
  { key: "account", label: "Account" },
];

export default function SideMenu({ open, activeTab, onClose, onSelect }) {
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
        </div>
      </div>
    </>
  );
}
