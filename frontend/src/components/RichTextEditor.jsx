import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";

// ✅ Auto-selects the word at cursor if no text is selected before applying a mark
function applyMark(editor, markCommand) {
  const { from, empty } = editor.state.selection;

  if (!empty) {
    // Text already selected — apply normally
    markCommand();
    return;
  }

  const { doc } = editor.state;
  const $pos = doc.resolve(from);
  const start = $pos.start();
  const end = $pos.end();

  const nodeText = doc.textBetween(start, end, "");
  const cursorOffset = from - start;

  // Walk left to find word start
  let wordStart = cursorOffset;
  while (wordStart > 0 && /\w/.test(nodeText[wordStart - 1])) wordStart--;

  // Walk right to find word end
  let wordEnd = cursorOffset;
  while (wordEnd < nodeText.length && /\w/.test(nodeText[wordEnd])) wordEnd++;

  if (wordStart === wordEnd) {
    // Cursor not on a word — apply to whole node as fallback
    markCommand();
    return;
  }

  // Select the word then apply the mark
  editor
    .chain()
    .focus()
    .setTextSelection({ from: start + wordStart, to: start + wordEnd })
    .run();

  markCommand();
}

export default function RichTextEditor({ value, onChange }) {
  const onChangeRef = useRef(onChange);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        horizontalRule: false,
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: true }),
      Placeholder.configure({ placeholder: "Write something..." }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true;
      onChangeRef.current?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor p-4 min-h-[180px] focus:outline-none",
      },
    },
  });

  // ✅ Only sync from outside — skip if the editor itself caused the change
  useEffect(() => {
    if (!editor) return;
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const addLink = () => {
    const url = prompt("Enter URL");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const cmd = (e, fn) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  const btn = (isActive = false) =>
    `px-2.5 py-1 rounded-md text-sm font-medium cursor-pointer select-none border transition-all duration-100 ${
      isActive
        ? "bg-blue-600 text-white border-blue-700 shadow-inner"
        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
    }`;

  return (
    <>
      <style>{`
        .tiptap-editor h1 { font-size: 1.875rem; font-weight: 700; margin: 0.75rem 0; line-height: 1.2; }
        .tiptap-editor h2 { font-size: 1.5rem;   font-weight: 700; margin: 0.65rem 0; line-height: 1.25; }
        .tiptap-editor h3 { font-size: 1.25rem;  font-weight: 600; margin: 0.5rem 0;  line-height: 1.3; }
        .tiptap-editor h4 { font-size: 1.1rem;   font-weight: 600; margin: 0.4rem 0;  line-height: 1.35; }
        .tiptap-editor p  { font-size: 0.9rem; margin: 0.25rem 0; line-height: 1.6; }
        .tiptap-editor ul { list-style-type: disc;    padding-left: 1.5rem; margin: 0.5rem 0; }
        .tiptap-editor ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .tiptap-editor li { margin: 0.2rem 0; font-size: 0.9rem; }
        .tiptap-editor blockquote {
          border-left: 3px solid #6366f1;
          padding-left: 1rem;
          margin: 0.75rem 0;
          color: #6b7280;
          font-style: italic;
        }
        .tiptap-editor hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
        .tiptap-editor a  { color: #3b82f6; text-decoration: underline; }
        .tiptap-editor .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        {/* TOOLBAR */}
        <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 border-b border-gray-200">

          {/* Text Size Group */}
          <div className="flex items-center gap-1 pr-2.5 border-r border-gray-200">
            <button
              type="button"
              onMouseDown={(e) =>
                cmd(e, () => editor.chain().focus().setParagraph().run())
              }
              className={btn(
                editor.isActive("paragraph") && !editor.isActive("heading")
              )}
            >
              P
            </button>
            {[1, 2, 3, 4].map((level) => (
              <button
                key={level}
                type="button"
                onMouseDown={(e) =>
                  cmd(e, () =>
                    editor.chain().focus().toggleHeading({ level }).run()
                  )
                }
                className={btn(editor.isActive("heading", { level }))}
              >
                H{level}
              </button>
            ))}
          </div>

          {/* Formatting Group — uses applyMark for word-level targeting */}
          <div className="flex items-center gap-1 pr-2.5 border-r border-gray-200">
            <button
              type="button"
              onMouseDown={(e) =>
                cmd(e, () =>
                  applyMark(editor, () =>
                    editor.chain().focus().toggleBold().run()
                  )
                )
              }
              className={`${btn(editor.isActive("bold"))} font-bold`}
            >
              B
            </button>
            <button
              type="button"
              onMouseDown={(e) =>
                cmd(e, () =>
                  applyMark(editor, () =>
                    editor.chain().focus().toggleItalic().run()
                  )
                )
              }
              className={`${btn(editor.isActive("italic"))} italic`}
            >
              I
            </button>
            <button
              type="button"
              onMouseDown={(e) =>
                cmd(e, () =>
                  applyMark(editor, () =>
                    editor.chain().focus().toggleUnderline().run()
                  )
                )
              }
              className={`${btn(editor.isActive("underline"))} underline`}
            >
              U
            </button>
            <button
              type="button"
              onMouseDown={(e) =>
                cmd(e, () =>
                  applyMark(editor, () =>
                    editor.chain().focus().toggleStrike().run()
                  )
                )
              }
              className={`${btn(editor.isActive("strike"))} line-through`}
            >
              S
            </button>
          </div>

          {/* Lists & Block Group */}
          <div className="flex items-center gap-1 pr-2.5 border-r border-gray-200">
            <button
              type="button"
              onMouseDown={(e) =>
                cmd(e, () => editor.chain().focus().toggleBulletList().run())
              }
              className={btn(editor.isActive("bulletList"))}
            >
              • List
            </button>
            <button
              type="button"
              onMouseDown={(e) =>
                cmd(e, () => editor.chain().focus().toggleOrderedList().run())
              }
              className={btn(editor.isActive("orderedList"))}
            >
              1. List
            </button>
            <button
              type="button"
              onMouseDown={(e) =>
                cmd(e, () => editor.chain().focus().toggleBlockquote().run())
              }
              className={btn(editor.isActive("blockquote"))}
            >
              ❝
            </button>
            <button
              type="button"
              onMouseDown={(e) =>
                cmd(e, () => editor.chain().focus().setHorizontalRule().run())
              }
              className={btn()}
            >
              ―
            </button>
          </div>

          {/* Color & Misc Group */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onMouseDown={(e) => cmd(e, addLink)}
              className={btn()}
            >
              🔗
            </button>
            <input
              type="color"
              title="Text color"
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) =>
                editor.chain().focus().setColor(e.target.value).run()
              }
              className="w-8 h-8 border border-gray-200 rounded cursor-pointer p-0.5 bg-white"
            />
            <button
              type="button"
              onMouseDown={(e) =>
                cmd(e, () =>
                  applyMark(editor, () =>
                    editor.chain().focus().toggleHighlight().run()
                  )
                )
              }
              className={btn(editor.isActive("highlight"))}
            >
              Highlight
            </button>
            <button
              type="button"
              onMouseDown={(e) =>
                cmd(e, () => {
                  editor.chain().focus().unsetAllMarks().clearNodes().run();
                })
              }
              className={btn()}
            >
              Clear
            </button>
          </div>
        </div>

        {/* EDITOR CONTENT */}
        <EditorContent editor={editor} />
      </div>
    </>
  );
}