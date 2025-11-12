"use client";

import { useEffect, useState } from "react";
import { Toast } from "@/components/ui/toast";
import { toastService, type ToastProps } from "@/services/toast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  useEffect(() => {
    const unsubscribe = toastService.subscribe((toast) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { ...toast, id }]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </>
  );
}
