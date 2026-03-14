"use client";

import React from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Heading2,
  ListOrdered,
  List,
  Quote,
  Undo2,
  Redo2,
  Link2,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}

function buildExtensions() {
  return [
    StarterKit.configure({
      heading: {
        levels: [2, 3],
      },
    }),
    Link.configure({
      openOnClick: true,
      autolink: true,
      linkOnPaste: true,
    }),
  ];
}

function Toolbar({ editor }: { editor: Editor }) {
  if (!editor) return null;

  const toggleHeading = (level: 2 | 3) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | null;
    // eslint-disable-next-line no-alert
    const url = window.prompt("URL", previousUrl ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted px-2 py-1.5 text-xs">
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("bold") ? "default" : "ghost"}
        className="h-7 w-7"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-3 w-3" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("italic") ? "default" : "ghost"}
        className="h-7 w-7"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-3 w-3" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
        className="h-7 w-7"
        onClick={() => toggleHeading(2)}
      >
        <Heading2 className="h-3 w-3" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("bulletList") ? "default" : "ghost"}
        className="h-7 w-7"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-3 w-3" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("orderedList") ? "default" : "ghost"}
        className="h-7 w-7"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-3 w-3" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={editor.isActive("blockquote") ? "default" : "ghost"}
        className="h-7 w-7"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-3 w-3" />
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={setLink}
      >
        <Link2 className="h-3 w-3" />
      </Button>
      <div className="ml-auto flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: buildExtensions(),
    content: value || "<p></p>",
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none",
      },
    },
  });

  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col rounded-xl border border-white/10 bg-white/[0.04] dark:border-white/10 dark:bg-white/[0.04]",
        className
      )}
    >
      {editor && <Toolbar editor={editor} />}
      <div className="min-h-[220px] overflow-y-auto px-6 py-4 text-foreground">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

