"use client";

import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

interface DownloadOverlayProps {
  isVisible: boolean;
  progress?: number;
  status?: "processing" | "downloading" | "completed" | "error";
  message?: string;
  className?: string;
}

export function DownloadOverlay({
  isVisible,
  progress = 0,
  status = "processing",
  message,
  className,
}: DownloadOverlayProps) {
  if (!isVisible) return null;

  const getStatusIcon = () => {
    switch (status) {
      case "processing":
        return <Download className="h-8 w-8 text-blue-500" />;
      case "downloading":
        return <Download className="h-8 w-8 text-green-500" />;
      case "completed":
        return <Download className="h-8 w-8 text-green-500" />;
      case "error":
        return <Download className="h-8 w-8 text-red-500" />;
      default:
        return <Download className="h-8 w-8 text-blue-500" />;
    }
  };

  const getStatusMessage = () => {
    if (message) return message;

    switch (status) {
      case "processing":
        return "Processing export...";
      case "downloading":
        return "Downloading file...";
      case "completed":
        return "Download completed!";
      case "error":
        return "Download failed";
      default:
        return "Processing...";
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center",
        className
      )}
    >
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 relative">
        {/* Loading line at the top of the dialog */}
        {status === "processing" && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-t-lg animate-pulse" />
        )}

        <div className="flex flex-col items-center space-y-4">
          {getStatusIcon()}

          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {getStatusMessage()}
            </h3>

            {status === "processing" && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            )}

            {status === "downloading" && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            )}

            {progress > 0 && (
              <p className="text-sm text-gray-600">
                {Math.round(progress)}% complete
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
