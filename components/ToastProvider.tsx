"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastApi = {
  notify: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Record<string, number>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timeoutsRef.current[id]) {
      window.clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
  }, []);

  const notify = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    timeoutsRef.current[id] = window.setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  const api = useMemo<ToastApi>(() => ({
    notify,
    success: (message) => notify(message, "success"),
    error: (message) => notify(message, "error"),
    info: (message) => notify(message, "info"),
  }), [notify]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "relative min-w-[220px] max-w-[360px] rounded-xl border px-4 py-3 shadow-lg",
              "backdrop-blur-xl bg-white/90 text-slate-900",
              t.type === "success" && "border-emerald-200",
              t.type === "error" && "border-red-200",
              t.type === "info" && "border-sky-200",
            ].filter(Boolean).join(" ")}
            role="status"
          >
            <div className="text-sm font-semibold">
              {t.type === "success" && "Success"}
              {t.type === "error" && "Error"}
              {t.type === "info" && "Notice"}
            </div>
            <div className="text-sm text-slate-600 mt-0.5">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
              aria-label="Dismiss"
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
