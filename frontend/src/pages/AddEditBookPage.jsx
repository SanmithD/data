/* eslint-disable react-hooks/exhaustive-deps */
import { ArrowLeft, Loader2, Tag, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RichTextEditor from "../components/RichTextEditor";
import { useBookStore } from "../store/useBookStore";
import toast from "react-hot-toast";

/* ───────── UI HELPERS ───────── */

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
      {children}
    </p>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
      {children}
      {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function InputBase({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl
      placeholder:text-gray-400 outline-none transition-all
      focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 ${className}`}
      {...props}
    />
  );
}

/* ───────── MAIN PAGE ───────── */

export default function AddEditBookPage() {
  const navigate = useNavigate();
  const { bookId } = useParams();

  const { createBook, updateBook, fetchBookById, bookDetails } = useBookStore();
  const isEdit = Boolean(bookId);
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    price: "",
    category: "",
    pages: [{ title: "Page 1", content: "" }], // default page
  });

  // Load book for edit
  useEffect(() => {
    if (isEdit) fetchBookById(bookId);
  }, [bookId]);

  useEffect(() => {
    if (isEdit && bookDetails) {
      setFormData({
        title: bookDetails.title || "",
        author: bookDetails.author || "",
        description: bookDetails.description || "",
        price: bookDetails.price || "",
        category: bookDetails.category || "",
        pages: bookDetails.pages?.length
          ? bookDetails.pages
          : [{ title: "Page 1", content: "" }],
      });
      setCoverPreview(bookDetails.cover_image?.url || null);
    }
  }, [bookDetails]);

  /* Add inside your AddEditBookPage component */

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCoverPreview(URL.createObjectURL(file));

    // ✅ Convert File → base64 string so it can be sent as JSON
    const reader = new FileReader();
    reader.onloadend = () => {
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        toast.error("Image must be under 5MB");
        return;
      }
      setFormData((prev) => ({ ...prev, cover_image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Handle input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle page content
  const handlePageChange = (index, key, value) => {
    const updatedPages = [...formData.pages];
    updatedPages[index][key] = value;
    setFormData((prev) => ({ ...prev, pages: updatedPages }));
  };

  // Add new page
  const addPage = () => {
    const newPageNum = formData.pages.length + 1;
    setFormData((prev) => ({
      ...prev,
      pages: [...prev.pages, { title: `Page ${newPageNum}`, content: "" }],
    }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await updateBook(bookId, formData);
      } else {
        await createBook(formData);
      }
      navigate("/books");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = formData.title.trim() && !loading;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-7"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold">
            {isEdit ? "Edit Book" : "Create Book"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your book details here.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            {/* Core Info */}
            <div className="px-7 py-6 border-b">
              <SectionLabel>Core Information</SectionLabel>

              <div className="sm:col-span-2">
                <FieldLabel>Cover Image</FieldLabel>
                <div
                  className="border-dashed border-2 border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-indigo-500"
                  onClick={() => document.getElementById("coverInput").click()}
                >
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Cover Preview"
                      className="h-32 object-contain mb-2"
                    />
                  ) : (
                    <>
                      <p className="text-sm">
                        Drag & drop or click to upload cover image
                      </p>
                    </>
                  )}
                  <input
                    type="file"
                    id="coverInput"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                </div>
              </div>

              <div className="mb-5">
                <FieldLabel required>Title</FieldLabel>
                <InputBase
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Book title..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Author</FieldLabel>
                  <InputBase
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    placeholder="Author name"
                    required
                  />
                </div>

                <div>
                  <FieldLabel required>Price</FieldLabel>
                  <InputBase
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="₹ Price"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <FieldLabel>
                    <Tag size={13} /> Category
                  </FieldLabel>
                  <InputBase
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Fiction, Tech"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="px-7 py-6 border-b">
              <SectionLabel>Description</SectionLabel>
              <RichTextEditor
                value={formData.description}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, description: val }))
                }
              />
            </div>

            {/* Pages */}
            <div className="px-7 py-6 border-b">
              <SectionLabel>Pages</SectionLabel>
              {formData.pages.map((page, index) => (
                <div
                  key={index}
                  className="mb-6 border border-gray-200 rounded-xl p-4 bg-gray-50"
                >
                  <FieldLabel required>Page Title</FieldLabel>
                  <InputBase
                    value={page.title}
                    onChange={(e) =>
                      handlePageChange(index, "title", e.target.value)
                    }
                    placeholder={`Page ${index + 1} title`}
                  />
                  <div className="mt-3">
                    <FieldLabel>Content</FieldLabel>
                    <RichTextEditor
                      value={page.content}
                      onChange={(val) =>
                        handlePageChange(index, "content", val)
                      }
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addPage}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-sm hover:bg-indigo-200 transition"
              >
                <Plus size={14} /> Add New Page
              </button>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-7 py-4 bg-gray-50 border-t">
              <p className="text-xs text-gray-400">
                <span className="text-red-500">*</span> Required fields
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 border rounded-xl text-gray-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl
                  hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {isEdit ? "Update Book" : "Create Book"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
