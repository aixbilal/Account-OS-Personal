import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

interface ToastOptions {
  tone?: ToastTone;
}

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<((message: string, options?: ToastOptions) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const notify = useCallback((message: string, options?: ToastOptions) => {
    setToasts((current) => [
      ...current,
      { id: crypto.randomUUID(), message, tone: options?.tone ?? "success" },
    ].slice(-3));
  }, []);

  const contextValue = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div aria-label="Notifications" className="toast-viewport" role="region">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 3200);
    return () => window.clearTimeout(timeout);
  }, [onDismiss]);
  const Icon = toast.tone === "error" ? CircleAlert : toast.tone === "info" ? Info : CheckCircle2;
  return (
    <div className="toast" data-tone={toast.tone} role={toast.tone === "error" ? "alert" : "status"}>
      <Icon aria-hidden="true" size={18} />
      <span>{toast.message}</span>
      <button aria-label="Dismiss notification" onClick={onDismiss} type="button"><X size={15} /></button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
