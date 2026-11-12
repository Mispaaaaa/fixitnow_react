import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon';
import { cn } from '../lib/utils';

const ToastContext = createContext(null);

const VARIANTS = {
  success: { className: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: 'check' },
  error: { className: 'border-rose-200 bg-rose-50 text-rose-900', icon: 'alert-triangle' },
  info: { className: 'border-sky-200 bg-sky-50 text-sky-900', icon: 'info' },
  warning: { className: 'border-amber-200 bg-amber-50 text-amber-900', icon: 'alert-triangle' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (message, variant = 'info', options = {}) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((items) => [...items, { id, message, variant, title: options.title }]);
      window.setTimeout(() => dismiss(id), options.duration || 4000);
      return id;
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message, options) => push(message, 'success', options),
      error: (message, options) => push(message, 'error', options),
      info: (message, options) => push(message, 'info', options),
      warning: (message, options) => push(message, 'warning', options),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-3 sm:inset-x-auto sm:bottom-6 sm:right-4 sm:items-end sm:px-0">
        {toasts.map((item) => {
          const variant = VARIANTS[item.variant] || VARIANTS.info;
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-xl border px-4 py-3 shadow-lg',
                variant.className
              )}
            >
              <Icon name={variant.icon} className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1 text-sm">
                {item.title && <p className="font-semibold">{item.title}</p>}
                <p>{item.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded p-1 opacity-60 transition hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}