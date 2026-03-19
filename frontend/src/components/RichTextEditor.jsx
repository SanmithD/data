import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit, // includes strike + blockquote already
      Underline,
      TextStyle,
      Color,
      Highlight,
      HorizontalRule,
      Link.configure({
        openOnClick: true,
      }),
      Placeholder.configure({
        placeholder: "Write something clean...",
      }),
    ],

    content: value || "",

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },

    editorProps: {
      attributes: {
        class: "p-4 min-h-[180px] focus:outline-none prose prose-sm max-w-none",
      },
    },
  });

  // Fix sync bug
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) return null;

  // helpers
  const addLink = () => {
    const url = prompt("Enter URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* TOOLBAR */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-b">
        {/* BASIC */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          className={`btn ${editor.isActive("bold") && "active"}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
          className={`btn ${editor.isActive("italic") && "active"}`}
        >
          I
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleUnderline().run();
          }}
          className={`btn ${editor.isActive("underline") && "active"}`}
        >
          U
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleStrike().run();
          }}
          className={`btn ${editor.isActive("strike") && "active"}`}
        >
          S
        </button>

        {/* LIST */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
          }}
          className="btn"
        >
          • List
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
          }}
          className="btn"
        >
          1. List
        </button>

        {/* BLOCKQUOTE */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBlockquote().run();
          }}
          className={`btn ${editor.isActive("blockquote") && "active"}`}
        >
          ❝
        </button>

        {/* HORIZONTAL LINE */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().setHorizontalRule().run();
          }}
          className="btn"
        >
          ―
        </button>

        {/* LINK */}
        <button type="button" onClick={addLink} className="btn">
          🔗
        </button>

        {/* COLOR */}
        <input
          type="color"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().setColor(e.target.value).run();
          }}
          className="w-8 h-8 border rounded cursor-pointer"
        />

        {/* HIGHLIGHT */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHighlight().run();
          }}
          className="btn"
        >
          Highlight
        </button>

        {/* CLEAR */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            editor.chain().focus().unsetAllMarks().run();
          }}
          className="btn"
        >
          Clear
        </button>
      </div>

      {/* EDITOR */}
      <EditorContent editor={editor} />

      {/* STYLES */}
      <style jsx>{`
        .btn {
          padding: 6px 10px;
          border-radius: 6px;
          background: white;
          font-size: 14px;
          cursor: pointer;
        }
        .btn:hover {
          background: #e5e7eb;
        }
        .active {
          background: #3b82f6;
          color: white;
        }
      `}</style>
    </div>
  );
}
