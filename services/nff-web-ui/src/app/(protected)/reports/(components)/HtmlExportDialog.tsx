"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useExportAndGetHtml } from "@/hooks/reports/useExports";
import { Copy, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import copy from "copy-to-clipboard";

interface HtmlExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: number;
  reportTitle?: string;
  htmlContent?: string;
}

export function HtmlExportDialog({
  isOpen,
  onClose,
  reportId,
  reportTitle = "Report",
  htmlContent: providedHtmlContent,
}: HtmlExportDialogProps) {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const exportHtmlMutation = useExportAndGetHtml();

  const fetchHtmlContent = useCallback(async () => {
    try {
      const html = await exportHtmlMutation.mutateAsync({
        reportId,
        config: {
          includeCharts: true,
          includeImages: true,
        },
      });
      setHtmlContent(html);
    } catch (error) {
      console.error("Error fetching HTML content:", error);
      setHtmlContent("");
    }
  }, [reportId, exportHtmlMutation.mutateAsync]);

  useEffect(() => {
    if (isOpen && reportId) {
      if (providedHtmlContent) {
        setHtmlContent(providedHtmlContent);
      } else {
        fetchHtmlContent();
      }
    }
  }, [isOpen, reportId, providedHtmlContent]);

  const handleCopyToClipboard = () => {
    try {
      const success = copy(htmlContent);

      if (success) {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleSaveAsFile = () => {
    try {
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const timestamp = `${year}${month}${day}_${hours}${minutes}`;

      const sanitizedTitle = reportTitle
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();

      link.download = `${sanitizedTitle}_${timestamp}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to save file:", error);
    }
  };

  const handleClose = () => {
    setHtmlContent("");
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-5xl h-[90vh] overflow-hidden flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-xl font-semibold">
              Export to HTML
            </DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-muted"
            disabled={exportHtmlMutation.isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-end items-center mb-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                disabled={!htmlContent || exportHtmlMutation.isPending}
              >
                {copied ? (
                  <>✓ Copied!</>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-muted/50">
            {htmlContent ? (
              <Textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="HTML content will appear here..."
                className="w-full h-full resize-none font-mono text-sm border-0 focus-visible:ring-0 bg-transparent"
                readOnly={false}
              />
            ) : exportHtmlMutation.isPending ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-[#707FDD]" />
                  <p>Generating HTML content...</p>
                </div>
              </div>
            ) : exportHtmlMutation.isError ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p>Failed to generate HTML content</p>
                  <p className="text-xs mt-2">Check the error message above</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p>HTML content will appear here</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={exportHtmlMutation.isPending}
            >
              Cancel
            </Button>
            {htmlContent && (
              <Button
                onClick={handleSaveAsFile}
                disabled={exportHtmlMutation.isPending}
              >
                Save as HTML file
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
