"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";

export type ToastMessage = {
  id: number;
  type: "success" | "error";
  message: string;
};

export default function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-5 top-5 z-[70] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = toast.type === "success" ? CheckCircle2 : AlertCircle;
        const styles =
          toast.type === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-800";
        const iconStyles =
          toast.type === "success" ? "text-green-600" : "text-red-600";

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-xl shadow-slate-900/10 ${styles}`}
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${iconStyles}`} />
            <p className="flex-1 text-sm font-medium leading-relaxed">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="rounded-lg p-1 opacity-70 transition hover:bg-white/70 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
