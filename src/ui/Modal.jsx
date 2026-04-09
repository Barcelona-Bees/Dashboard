import { useEffect, useRef } from "react";

/**
 * Dialog shell: Escape closes, initial focus moves to first focusable control,
 * aria-labelledby should point at the visible title element id.
 */
export default function Modal({ onClose, children, ariaLabelledBy }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const root = panelRef.current;
    if (!root) return;
    const focusable = root.querySelector(
      'button:not([disabled]), [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    requestAnimationFrame(() => focusable?.focus());
  }, []);

  return (
    <div
      className="modalWrap"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy || undefined}
    >
      <div className="backdrop" aria-hidden="true" onClick={onClose} />
      <div className="modalPanel" ref={panelRef}>
        {children}
      </div>
    </div>
  );
}
