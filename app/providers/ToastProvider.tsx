"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  leaving?: boolean;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ── Icons ─────────────────────────────────────────────────────────────────

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success")
    return (
      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  if (type === "error")
    return (
      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    );
  if (type === "warning")
    return (
      <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    );
  return (
    <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

const toastStyles: Record<ToastType, string> = {
  success: "border-emerald-200 bg-white",
  error: "border-red-200 bg-white",
  warning: "border-amber-200 bg-white",
  info: "border-blue-200 bg-white",
};

const progressColors: Record<ToastType, string> = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

// ── Individual Toast ──────────────────────────────────────────────────────

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [progress, setProgress] = useState(100);
  const startTime = useRef(Date.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const total = toast.duration;
    const update = () => {
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, 100 - (elapsed / total) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(update);
      }
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [toast.duration]);

  return (
    <div
      className={`
        relative w-80 max-w-full rounded-2xl border shadow-lg overflow-hidden
        ${toastStyles[toast.type]}
        ${toast.leaving ? "animate-toast-out" : "animate-toast-in"}
      `}
    >
      <div className="flex items-start gap-3 p-4">
        <ToastIcon type={toast.type} />
        <p className="flex-1 text-sm font-medium text-slate-800 leading-relaxed pt-0.5">
          {toast.message}
        </p>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-slate-100">
        <div
          className={`h-full ${progressColors[toast.type]} transition-none`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 350);
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const container =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
              <div key={toast.id} className="pointer-events-auto">
                <ToastItem toast={toast} onRemove={removeToast} />
              </div>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {container}
    </ToastContext.Provider>
  );
}
