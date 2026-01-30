export default function Modal({ onClose, children }) {
  return (
    <div className="modalWrap" role="dialog" aria-modal="true">
      <div className="backdrop" onClick={onClose} />
      <div className="modalPanel">
        {children}
      </div>
    </div>
  );
}
