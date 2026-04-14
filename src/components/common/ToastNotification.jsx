import { useEffect, useState } from 'react';

const toneMap = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-primary/20 bg-primary/5 text-textMain',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

function ToastNotification() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (event) => {
      setToasts((currentToasts) => [...currentToasts, event.detail]);
    };

    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, []);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const timeout = window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.slice(1));
    }, 2800);

    return () => window.clearTimeout(timeout);
  }, [toasts]);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div key={toast.id} className={`pointer-events-auto rounded-3xl border px-4 py-4 shadow-soft ${toneMap[toast.type] || toneMap.success}`}>
          <p className="text-sm font-semibold">{toast.title}</p>
          <p className="mt-1 text-sm opacity-80">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}

export default ToastNotification;
