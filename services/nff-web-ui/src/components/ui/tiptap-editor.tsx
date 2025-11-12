"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Button } from "./button";
import { Input } from "./input";
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  List,
  ListOrdered,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface TiptapEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  disableLists?: boolean;
  toolbarType?: "full" | "lists-only";
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "Enter your text...",
  className = "",
  disableLists = false,
  toolbarType = "full",
}: TiptapEditorProps) {
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkPosition, setLinkPosition] = useState({ top: 0, left: 0 });
  const [hasSelection, setHasSelection] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    if (!showLinkPopup) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowLinkPopup(false);
        setLinkUrl("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLinkPopup]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings if not needed
        ...(disableLists && {
          bulletList: false,
          orderedList: false,
        }),
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary cursor-pointer hover:text-primary/90",
        },
        validate: (href) => {
          return /^https?:\/\//.test(href);
        },
        protocols: ["http", "https"],
        defaultProtocol: "https",
      }),
      TextAlign.configure({
        types: ["paragraph"],
      }),
      Underline,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none p-4 min-h-[120px]",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      setHasSelection(from !== to);
    },
    immediatelyRender: false, // Fix SSR hydration mismatch
  });

  if (!editor) {
    return (
      <div className={`border border-border rounded-lg ${className}`}>
        <div className="p-4 min-h-[200px] bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  const setLink = () => {
    if (linkUrl === "") {
      // Remove link and clean up any stray formatting
      editor.chain().focus().unsetLink().run();
      // Clear any underline formatting that might be left behind
      editor.chain().focus().unsetMark("underline").run();
      setShowLinkPopup(false);
      return;
    }

    // Get current selection range
    const { from, to } = editor.state.selection;
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;

    // Get the selected text
    const selectedText = editor.state.doc.textBetween(from, to);

    // Replace the selected text with a link wrapped in its own paragraph
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(`<p><a href="${url}">${selectedText}</a></p>`)
      .run();

    const newPosition =
      from + `<p><a href="${url}">${selectedText}</a></p>`.length;
    editor.chain().focus().setTextSelection(newPosition).run();

    setShowLinkPopup(false);
    setLinkUrl("");
  };

  const handleLinkClick = () => {
    if (!hasSelection) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href;
    setLinkUrl(previousUrl || "");

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorContainerRef.current) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = editorContainerRef.current.getBoundingClientRect();

      setLinkPosition({
        top: rect.bottom - containerRect.top + 10,
        left: rect.left - containerRect.left,
      });
    }

    setShowLinkPopup(true);
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    editor.chain().focus().unsetMark("underline").run();
    setShowLinkPopup(false);
    setLinkUrl("");
  };

  return (
    <div
      className={`border border-border rounded-lg relative ${className}`}
      ref={editorContainerRef}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted flex-wrap">
        {toolbarType === "full" && (
          <>
            <Button
              type="button"
              variant={editor.isActive("bold") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold (Ctrl+B)"
              className={
                editor.isActive("bold")
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              }
            >
              <Bold className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant={editor.isActive("italic") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic (Ctrl+I)"
              className={
                editor.isActive("italic")
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              }
            >
              <Italic className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            <Button
              type="button"
              variant={
                editor.isActive({ textAlign: "left" }) ? "default" : "ghost"
              }
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              title="Align Left"
              className={
                editor.isActive({ textAlign: "left" })
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              }
            >
              <AlignLeft className="h-4 w-4" />
            </Button>

            {/* Align Center */}
            <Button
              type="button"
              variant={
                editor.isActive({ textAlign: "center" }) ? "default" : "ghost"
              }
              size="sm"
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              title="Align Center"
              className={
                editor.isActive({ textAlign: "center" })
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              }
            >
              <AlignCenter className="h-4 w-4" />
            </Button>

            {/* Align Right */}
            <Button
              type="button"
              variant={
                editor.isActive({ textAlign: "right" }) ? "default" : "ghost"
              }
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              title="Align Right"
              className={
                editor.isActive({ textAlign: "right" })
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              }
            >
              <AlignRight className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Link */}
            <Button
              type="button"
              variant={editor.isActive("link") ? "default" : "ghost"}
              size="sm"
              onClick={handleLinkClick}
              title={hasSelection ? "Add Link" : "Select text to add link"}
              disabled={!hasSelection}
              className={
                editor.isActive("link")
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : hasSelection
                  ? "hover:bg-gray-100"
                  : "opacity-50 cursor-not-allowed"
              }
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </>
        )}

        {!disableLists && (
          <>
            {toolbarType === "full" && (
              <div className="w-px h-6 bg-gray-300 mx-1" />
            )}

            {/* Bullet List */}
            <Button
              type="button"
              variant={editor.isActive("bulletList") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
              className={
                editor.isActive("bulletList")
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              }
            >
              <List className="h-4 w-4" />
            </Button>

            {/* Ordered List */}
            <Button
              type="button"
              variant={editor.isActive("orderedList") ? "default" : "ghost"}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
              className={
                editor.isActive("orderedList")
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-muted"
              }
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <EditorContent editor={editor} />

      {showLinkPopup && (
        <div
          ref={popupRef}
          className="absolute z-50 bg-popover border border-border rounded-lg shadow-lg p-3"
          style={{
            top: `${linkPosition.top}px`,
            left: `${linkPosition.left}px`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-popover-foreground">Enter link:</span>
            <Input
              type="text"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setLink();
                } else if (e.key === "Escape") {
                  setShowLinkPopup(false);
                  setLinkUrl("");
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={setLink}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1 text-sm"
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 120px;
          padding: 1rem;
        }

        .ProseMirror:focus {
          outline: none;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: "${placeholder}";
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .ProseMirror ul {
          list-style-type: disc;
        }

        .ProseMirror ol {
          list-style-type: decimal;
        }

        .ProseMirror li {
          margin: 0.25rem 0;
        }

        .ProseMirror strong {
          font-weight: bold;
        }

        .ProseMirror em {
          font-style: italic;
        }

        .ProseMirror p {
          margin: 0.5rem 0;
        }

        .ProseMirror a {
          color: #707fdd;
          text-decoration: none;
          cursor: pointer;
          pointer-events: auto;
          display: inline-block;
        }

        .ProseMirror a:hover {
          color: #5a6bc7;
          text-decoration: underline;
        }

        /* Ensure link doesn't extend beyond its content */
        .ProseMirror a:not([href]) {
          pointer-events: none;
          color: inherit;
          text-decoration: none;
        }

        /* Link paragraphs should be isolated */
        .ProseMirror p:has(a) {
          margin: 0.5rem 0;
          display: block;
        }

        .ProseMirror p:has(a) a {
          display: inline;
        }

        /* Text alignment */
        .ProseMirror [style*="text-align: left"] {
          text-align: left;
        }

        .ProseMirror [style*="text-align: center"] {
          text-align: center;
        }

        .ProseMirror [style*="text-align: right"] {
          text-align: right;
        }

        /* Custom primary color #707FDD */
        .bg-primary {
          background-color: #707fdd !important;
        }

        .text-primary-foreground {
          color: white !important;
        }

        .hover\\:bg-primary\\/90:hover {
          background-color: #5a6bc7 !important;
        }

        .focus\\:ring-primary:focus {
          --tw-ring-color: #707fdd !important;
        }

        .focus\\:border-primary:focus {
          border-color: #707fdd !important;
        }
      `}</style>
    </div>
  );
}
