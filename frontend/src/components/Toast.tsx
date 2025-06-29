import React, { useEffect } from 'react';

type ToastProps = {
  children: React.ReactNode;
  onClose?: () => void;
  onRetry?: () => void;
};

const Toast: React.FC<ToastProps> = ({ children, onClose, onRetry }) => {
  useEffect(() => {
    if (!onClose) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 bg-neutral-black text-white rounded-base px-4 py-3 shadow font-medium flex items-center gap-4 z-50">
      <span>{children}</span>
      {onRetry && (
        <button className="btn-secondary ml-2" onClick={onRetry}>Retry</button>
      )}
      {onClose && (
        <button className="btn-ghost ml-2" onClick={onClose} aria-label="Close">&times;</button>
      )}
    </div>
  );
};

export default Toast; 