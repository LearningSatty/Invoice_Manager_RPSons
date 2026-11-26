import { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import './Toast.css';

export default function Toast({ toast, onRemove }) {
  const iconMap = {
    error: <AlertTriangle className="toast-icon" />,
    success: <CheckCircle className="toast-icon" />,
    info: <Info className="toast-icon" />,
  };

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className={`toast toast--${toast.type}`} role="alert" aria-live="polite">
      <div className="toast-icon-wrapper">{iconMap[toast.type] || iconMap.error}</div>
      <div className="toast-message">{toast.message}</div>
      <button className="toast-dismiss" onClick={() => onRemove(toast.id)} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
