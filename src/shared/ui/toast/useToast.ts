import { useContext } from "react";
import { ToastContext } from "./ToastProvider";

/**
 * Raise a condition note.
 *
 *   const toast = useToast();
 *   toast.push({ tone: "saved", title: "Saved" });
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>.");
  }
  return context;
}
