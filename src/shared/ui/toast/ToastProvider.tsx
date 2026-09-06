import { createContext, useCallback, useMemo, useRef, useState } from "react";
import { ToastShelf } from "./ToastShelf";

export type ToastTone = "note" | "problem" | "saved";

export interface Toast {
  id: string;
  tone: ToastTone;
  /** The notation line — short, stated as a fact. */
  title: string;
  /** Optional sentence of detail. */
  body?: string;
  /** ms before it files itself away. 0 keeps it until dismissed. */
  duration: number;
}

export interface ToastInput {
  tone?: ToastTone;
  title: string;
  body?: string;
  duration?: number;
}

interface ToastContextValue {
  push: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/** Problems stay until read; confirmations file themselves away. */
const DEFAULT_DURATION: Record<ToastTone, number> = {
  note: 4000,
  saved: 3200,
  problem: 7000,
};

let counter = 0;

/**
 * The condition-note shelf.
 *
 * One place for the small facts an action produces — posted, saved,
 * withdrawn, failed — so they stop being inline banners that shift the
 * layout of whatever component happened to raise them.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    ({ tone = "note", title, body, duration }: ToastInput) => {
      const id = `toast-${++counter}`;
      const resolved = duration ?? DEFAULT_DURATION[tone];

      setToasts((current) => {
        // A burst of the same action should not bury the screen.
        const next = [...current, { id, tone, title, body, duration: resolved }];
        return next.slice(-3);
      });

      if (resolved > 0) {
        const timer = window.setTimeout(() => dismiss(id), resolved);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastShelf toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
