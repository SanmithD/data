import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

export default function RichTextEditor({ value, onChange }) {
  // ✅ FIX 1: Use a ref so the onUpdate closure always has the latest onChange
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      // ✅ FIX 2: StarterKit already has HorizontalRule — don't add it again
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight,
      Link.configure({
        openOnClick: true,
      }),
      Placeholder.configure({
        placeholder: "Write something clean...",
      }),
    ],

    content: value || "",

    onUpdate: ({ editor }) => {
      // ✅ FIX 1: Use ref — safe even if onChange was undefined initially
      onChangeRef.current?.(editor.getHTML());
    },

    editorProps: {
      attributes: {
        class:
          "p-4 min-h-[180px] focus:outline-none prose prose-sm max-w-none",
      },
    },
  });

  // Sync external value into editor WITHOUT triggering onUpdate
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // ✅ FIX 1: Pass `false` as 2nd arg to NOT emit the update event
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const addLink = () => {
    const url = prompt("Enter URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  // ✅ FIX 3: Replace <style jsx> with Tailwind classes
  const btn =
    "px-2.5 py-1.5 rounded-md bg-white text-sm cursor-pointer hover:bg-gray-200 transition-colors";
  const active = "!bg-blue-500 !text-white";

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* TOOLBAR */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-b">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          className={`${btn} font-bold ${editor.isActive("bold") ? active : ""}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
          className={`${btn} italic ${editor.isActive("italic") ? active : ""}`}
        >
          I
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleUnderline().run();
          }}
          className={`${btn} underline ${editor.isActive("underline") ? active : ""}`}
        >
          U
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleStrike().run();
          }}
          className={`${btn} line-through ${editor.isActive("strike") ? active : ""}`}
        >
          S
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
          }}
          className={btn}
        >
          • List
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
          }}
          className={btn}
        >
          1. List
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBlockquote().run();
          }}
          className={`${btn} ${editor.isActive("blockquote") ? active : ""}`}
        >
          ❝
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().setHorizontalRule().run();
          }}
          className={btn}
        >
          ―
        </button>

        <button type="button" onClick={addLink} className={btn}>
          🔗
        </button>

        <input
          type="color"
          onChange={(e) => {
            editor.chain().focus().setColor(e.target.value).run();
          }}
          className="w-8 h-8 border rounded cursor-pointer"
        />

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHighlight().run();
          }}
          className={btn}
        >
          Highlight
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().unsetAllMarks().run();
          }}
          className={btn}
        >
          Clear
        </button>
      </div>

      {/* EDITOR */}
      <EditorContent editor={editor} />

      {/* ✅ FIX 3: No more <style jsx> — all styles are Tailwind now */}
    </div>
  );
}