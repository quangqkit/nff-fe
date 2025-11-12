import { useState, useCallback } from "react";
import { ToastProps } from "@/services/toast";

interface UseToastReturn {
  toasts: ToastProps[];
  showToast: (toast: Omit<ToastProps, "id">) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastProps, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: ToastProps = {
        ...toast,
        id,
        onClose: () => hideToast(id),
      };

      setToasts((prev) => [...prev, newToast]);
    },
    [hideToast]
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    hideToast,
    clearToasts,
  };
}
