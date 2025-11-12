import { useEffect, useState, useRef } from "react";
import { Button } from "./button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from "lucide-react";

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  toolbarType?: "text" | "bullets" | "full";
}

export function RichTextEditor({
  content = "",
  onChange,
  placeholder = "Enter your paragraph...",
  className = "",
  toolbarType = "full",
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [editorContent, setEditorContent] = useState(content);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (content !== editorContent) {
      setEditorContent(content);
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [content]);

  const saveToHistory = (html: string) => {
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(html);
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      historyIndexRef.current++;
    }
    historyRef.current = newHistory;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  };

  const updateContent = (html: string) => {
    setEditorContent(html);
    saveToHistory(html);
    onChange?.(html);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      updateContent(html);
      updateFormattingState();
    }
  };

  const updateFormattingState = () => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element =
          container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : (container as Element);

        // Check if we're in bold/italic elements
        setIsBold(element?.closest("strong, b") !== null);
        setIsItalic(element?.closest("em, i") !== null);
      }
    }
  };

  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
    editorRef.current?.focus();
  };

  const handleBold = () => {
    execCommand("bold");
    setIsBold(!isBold);
  };

  const handleItalic = () => {
    execCommand("italic");
    setIsItalic(!isItalic);
  };

  const handleAlign = (align: string) => {
    execCommand("justify" + align);
  };

  const handleList = (type: "insertorderedlist" | "insertunorderedlist") => {
    execCommand(type);
  };

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const html = historyRef.current[historyIndexRef.current];
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
        setEditorContent(html);
        onChange?.(html);
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const html = historyRef.current[historyIndexRef.current];
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
        setEditorContent(html);
        onChange?.(html);
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          handleBold();
          break;
        case "i":
          e.preventDefault();
          handleItalic();
          break;
        case "z":
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          break;
        case "y":
          e.preventDefault();
          handleRedo();
          break;
      }
    }
  };

  const handleSelectionChange = () => {
    updateFormattingState();
  };

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  if (!isMounted) {
    return (
      <div className={`border border-gray-200 rounded-lg ${className}`}>
        <div className="p-4 min-h-[200px] bg-gray-50 flex items-center justify-center">
          <p className="text-gray-500">Loading text editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {/* Undo/Redo buttons */}
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            handleUndo();
          }}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="hover:bg-gray-100 disabled:opacity-50 transition-colors duration-150"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            handleRedo();
          }}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="hover:bg-gray-100 disabled:opacity-50 transition-colors duration-150"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {(toolbarType === "text" || toolbarType === "full") && (
          <>
            <Button
              variant={isBold ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                handleBold();
              }}
              title="Bold (Ctrl+B)"
              className={
                isBold
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "hover:bg-gray-100 transition-colors duration-150"
              }
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={isItalic ? "default" : "ghost"}
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                handleItalic();
              }}
              title="Italic (Ctrl+I)"
              className={
                isItalic
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "hover:bg-gray-100 transition-colors duration-150"
              }
            >
              <Italic className="h-4 w-4" />
            </Button>
          </>
        )}

        {(toolbarType === "bullets" || toolbarType === "full") && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                handleList("insertunorderedlist");
              }}
              title="Bullet List"
              className="hover:bg-gray-100 transition-colors duration-150"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                handleList("insertorderedlist");
              }}
              title="Numbered List"
              className="hover:bg-gray-100 transition-colors duration-150"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Text alignment for text and full toolbar types */}
        {(toolbarType === "text" || toolbarType === "full") && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                handleAlign("Left");
              }}
              title="Align Left"
              className="hover:bg-gray-100 transition-colors duration-150"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                handleAlign("Center");
              }}
              title="Align Center"
              className="hover:bg-gray-100 transition-colors duration-150"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={(e) => {
                e.preventDefault();
                handleAlign("Right");
              }}
              title="Align Right"
              className="hover:bg-gray-100 transition-colors duration-150"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="p-4 min-h-[120px] focus:outline-none prose prose-sm max-w-none [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:my-1 [&_p]:my-2"
        style={{
          minHeight: "120px",
          lineHeight: "1.6",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style jsx global>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
