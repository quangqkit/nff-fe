import { ToastProps } from "@/services/toast";

export interface ToastOptions {
  duration?: number;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
}

class ToastService {
  private listeners: Set<(toast: ToastProps & { id: string }) => void> =
    new Set();
  private toastCounter = 0;

  subscribe(listener: (toast: ToastProps & { id: string }) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(toast: ToastProps, options: ToastOptions = {}) {
    const id = `toast-${++this.toastCounter}`;
    this.listeners.forEach((listener) => listener({ ...toast, id }));
  }

  success(title: string, description?: string, options?: ToastOptions) {
    this.notify(
      {
        type: "success",
        title,
        description,
        duration: options?.duration || 3000,
      },
      options
    );
  }

  error(title: string, description?: string, options?: ToastOptions) {
    this.notify(
      {
        type: "error",
        title,
        description,
        duration: options?.duration || 5000,
      },
      options
    );
  }

  warning(title: string, description?: string, options?: ToastOptions) {
    this.notify(
      {
        type: "warning",
        title,
        description,
        duration: options?.duration || 4000,
      },
      options
    );
  }

  info(title: string, description?: string, options?: ToastOptions) {
    this.notify(
      {
        type: "info",
        title,
        description,
        duration: options?.duration || 3000,
      },
      options
    );
  }

  apiError(error: any, fallbackMessage = "An error occurred") {
    const message =
      error?.response?.data?.message || error?.message || fallbackMessage;
    this.error("API Error", message);
  }

  networkError() {
    this.error(
      "Network Error",
      "Please check your internet connection and try again"
    );
  }

  unauthorized() {
    this.error(
      "Unauthorized",
      "Your session has expired. Please log in again."
    );
  }

  successAction(action: string) {
    this.success("Success", `${action} completed successfully`);
  }
}

export const toastService = new ToastService();
