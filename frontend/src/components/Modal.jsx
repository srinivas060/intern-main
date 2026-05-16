import React, { useEffect } from 'react';

export default function Modal({ title, onClose, children, icon }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {title && (
          <div className="modal-title">
            {icon && <i className={`ti ti-${icon}`}></i>}
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
