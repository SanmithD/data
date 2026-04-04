/* eslint-disable react-hooks/exhaustive-deps */
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  GripVertical,
  ImagePlus,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import RichTextEditor from "../components/RichTextEditor";
import { useBookStore } from "../store/useBookStore";
import { usePageStore } from "../store/usePageStore";
import { CATEGORIES } from "../utils/categories_list";
import useDocumentTitle from "../utils/useDocumentTitle";

/* ── Field wrapper ── */
function Field({ label, required, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[13px] font-semibold text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 m-0">{hint}</p>}
    </div>
  );
}

/* ── Section card ── */
function SectionCard({ title, subtitle, children, action }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="m-0 text-[15px] font-bold text-gray-900 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-400 m-0">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/* ── Shared input ── */
function StyledInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 placeholder:text-gray-400 ${className}`}
    />
  );
}

/* ── Shared select ── */
function StyledSelect({ children, className = "", ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full px-3.5 py-2.5 pr-9 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none appearance-none cursor-pointer transition-all duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 ${className}`}
      >
        {children}
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

/* ── Page accordion card ── */
function PageCard({ page, index, onChange, onRemove, total }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2.5 px-4 py-3 cursor-pointer select-none border-b transition-colors ${open ? "bg-gray-50 border-gray-100" : "bg-white border-transparent"}`}
      >
        <GripVertical size={15} className="text-gray-300 shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="m-0 text-[13px] font-semibold text-gray-700 truncate">
            {page.title || `Page ${index + 1}`}
          </p>
          {!open && page.content && (
            <p
              className="mt-0.5 text-xs text-gray-400 truncate m-0"
              dangerouslySetInnerHTML={{
                __html:
                  page.content.replace(/<[^>]+>/g, " ").slice(0, 80) + "…",
              }}
            />
          )}
        </div>

        <span className="text-[11px] text-gray-400 shrink-0 bg-gray-100 px-2 py-0.5 rounded-full">
          #{index + 1}
        </span>

        {total > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            className="shrink-0 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}

        <ChevronDown
          size={14}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="p-4 flex flex-col gap-3.5">
          <Field label="Page Title" required>
            <StyledInput
              value={page.title}
              onChange={(e) => onChange(index, "title", e.target.value)}
              placeholder={`Page ${index + 1} title`}
            />
          </Field>
          <div>
            <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Content
            </label>
            <RichTextEditor
              value={page.content}
              onChange={(val) => onChange(index, "content", val)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function AddEditBookPage() {
  useDocumentTitle("Add Book | NumisVault");

  const navigate = useNavigate();
  const { bookId } = useParams();
  const coverInputRef = useRef(null);

  const { createBook, updateBook, fetchBookById, bookDetails } = useBookStore();
  const { pages, fetchPages, resetPages } = usePageStore();

  const isEdit = Boolean(bookId);
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    price: "",
    category: "",
    isPublished: 0,
    cover_image: "",
    pages: [{ title: "Page 1", content: "" }],
  });

  useEffect(() => {
    if (isEdit && bookId) {
      fetchBookById(bookId);
      fetchPages(bookId, 1, 1000);
    }
    return () => resetPages();
  }, [bookId]);

  useEffect(() => {
    if (isEdit && bookDetails) {
      setFormData((prev) => ({
        ...prev,
        title: bookDetails.title || "",
        author: bookDetails.author || "",
        description: bookDetails.description || "",
        price: bookDetails.price ?? "",
        category: bookDetails.category || "",
        isPublished:
          bookDetails.isPublished === 1 || bookDetails.isPublished === 0
            ? bookDetails.isPublished
            : 0,
      }));
      setCoverPreview(bookDetails.cover_image?.url || null);
    }
  }, [bookDetails]);

  useEffect(() => {
    if (isEdit) {
      setFormData((prev) => ({
        ...prev,
        pages:
          pages?.length > 0
            ? pages.map((page, index) => ({
                id: page.id,
                title: page.title || `Page ${index + 1}`,
                content: page.content || "",
                pageNumber: page.pageNumber || index + 1,
              }))
            : [{ title: "Page 1", content: "" }],
      }));
    }
  }, [pages]);

  const processImageFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setCoverPreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onloadend = () =>
      setFormData((prev) => ({ ...prev, cover_image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleCoverChange = (e) => processImageFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processImageFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "isPublished" ? Number(value) : value,
    }));
  };

  const handlePageChange = (index, key, value) => {
    const updatedPages = [...formData.pages];
    updatedPages[index] = { ...updatedPages[index], [key]: value };
    setFormData((prev) => ({ ...prev, pages: updatedPages }));
  };

  const addPage = () => {
    const n = formData.pages.length + 1;
    setFormData((prev) => ({
      ...prev,
      pages: [...prev.pages, { title: `Page ${n}`, content: "" }],
    }));
  };

  const removePage = (index) => {
    setFormData((prev) => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        isPublished: Number(formData.isPublished),
        pages: formData.pages.map((page, index) => ({
          id: page.id,
          title: page.title || `Page ${index + 1}`,
          content: page.content || "",
          pageNumber: index + 1,
        })),
      };
      if (isEdit) await updateBook(bookId, payload);
      else await createBook(payload);
      navigate("/books");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = formData.title.trim() && !loading;

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      {/* ── TOP BAR ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="text-gray-200">|</span>
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-indigo-500" />
              <span className="text-[14px] font-bold text-gray-900 tracking-tight">
                {isEdit ? "Edit Book" : "New Book"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-1.5 text-[13px] font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="book-form"
              disabled={!canSubmit}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading && <Loader2 size={13} className="animate-spin" />}
              {isEdit ? "Save Changes" : "Publish Book"}
            </button>
          </div>
        </div>
      </header>

      {/* ── PAGE BODY ── */}
      <div className="max-w-5xl mx-auto px-6 py-7 pb-16">
        <form id="book-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_296px] gap-5 items-start">
            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col gap-5">
              {/* Book Details */}
              <SectionCard
                title="Book Details"
                subtitle="Core metadata for this book"
              >
                <div className="flex flex-col gap-4">
                  <Field label="Title" required>
                    <StyledInput
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter book title…"
                      required
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3.5">
                    <Field label="Author" required>
                      <StyledInput
                        name="author"
                        value={formData.author}
                        onChange={handleChange}
                        placeholder="Author name"
                        required
                      />
                    </Field>
                    <Field label="Price (₹)" required>
                      <StyledInput
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        onWheel={(e) => e.target.blur()}
                        min={0}
                        required
                      />
                    </Field>
                  </div>
                  <Field label="Category">
                    <StyledSelect
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">Select a category…</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </StyledSelect>
                  </Field>
                </div>
              </SectionCard>

              {/* Description */}
              <SectionCard
                title="Description"
                subtitle="Displayed on the book detail page"
              >
                <RichTextEditor
                  value={formData.description}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, description: val }))
                  }
                />
              </SectionCard>

              {/* Pages */}
              <SectionCard
                title="Pages"
                subtitle={`${formData.pages.length} page${formData.pages.length !== 1 ? "s" : ""}`}
                action={
                  <button
                    type="button"
                    onClick={addPage}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition"
                  >
                    <Plus size={13} /> Add Page
                  </button>
                }
              >
                <div className="flex flex-col gap-2.5">
                  {formData.pages.map((page, index) => (
                    <PageCard
                      key={index}
                      page={page}
                      index={index}
                      onChange={handlePageChange}
                      onRemove={removePage}
                      total={formData.pages.length}
                    />
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-20">
              {/* Visibility */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3.5 border-b border-gray-100">
                  <p className="m-0 text-[13px] font-bold text-gray-900">
                    Visibility
                  </p>
                </div>
                <div className="px-4 py-4 flex flex-col gap-3">
                  <Field label="Status">
                    <StyledSelect
                      name="isPublished"
                      value={formData.isPublished}
                      onChange={handleChange}
                    >
                      <option value={0}>Draft</option>
                      <option value={1}>Published</option>
                    </StyledSelect>
                  </Field>
                  <div
                    className={`flex items-start gap-2 px-3 py-2.5 rounded-xl ${formData.isPublished === 1 ? "bg-green-50" : "bg-yellow-50"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 mt-1 ${formData.isPublished === 1 ? "bg-green-500" : "bg-yellow-400"}`}
                    />
                    <p
                      className={`m-0 text-xs leading-relaxed ${formData.isPublished === 1 ? "text-green-700" : "text-yellow-700"}`}
                    >
                      {formData.isPublished === 1
                        ? "This book is visible to all readers."
                        : "This book is saved as a draft and not visible."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cover Image */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <p className="m-0 text-[13px] font-bold text-gray-900">
                    Cover Image
                  </p>
                  {coverPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPreview(null);
                        setFormData((p) => ({ ...p, cover_image: "" }));
                      }}
                      className="p-0.5 text-gray-400 hover:text-gray-700 transition"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="px-4 py-4 flex flex-col gap-2.5">
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col items-center justify-center
                      ${dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40"}
                      ${coverPreview ? "p-0 min-h-[180px]" : "py-7 px-4"}`}
                  >
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Cover"
                        className="w-full block object-cover max-h-60"
                      />
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-2.5">
                          <ImagePlus size={18} className="text-indigo-500" />
                        </div>
                        <p className="m-0 text-[13px] font-medium text-gray-700">
                          Upload cover
                        </p>
                        <p className="mt-1 m-0 text-xs text-gray-400 text-center">
                          Drag & drop or click · PNG, JPG up to 5MB
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                  {coverPreview && (
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="w-full py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                    >
                      Replace image
                    </button>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3.5 border-b border-gray-100">
                  <p className="m-0 text-[13px] font-bold text-gray-900">
                    Summary
                  </p>
                </div>
                <div className="px-4 py-4 flex flex-col gap-2.5">
                  {[
                    { label: "Pages", value: formData.pages.length },
                    { label: "Category", value: formData.category || "—" },
                    { label: "Author", value: formData.author || "—" },
                    {
                      label: "Price",
                      value: formData.price
                        ? `₹${Number(formData.price).toLocaleString("en-IN")}`
                        : "—",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="text-xs text-gray-400 shrink-0">
                        {label}
                      </span>
                      <span className="text-xs font-semibold text-gray-700 text-right truncate max-w-[60%]">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
