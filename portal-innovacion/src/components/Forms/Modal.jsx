const Modal = ({ isOpen, onClose, title = 'Título predeterminado', children }) => {
  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2 className="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}; export default Modal;