/* eslint-disable react-hooks/exhaustive-deps */
import { ArrowLeft, ChevronDown, Link2, Loader2, Tag, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RichTextEditor from "../components/RichTextEditor";
import { useCardStore } from "../store/cardStore";
import { useTimelineCardStore } from "../store/timelineCardStore";

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
      {required && <span className="text-red-500 text-base leading-none">*</span>}
    </label>
  );
}

function InputBase({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl
        placeholder:text-gray-400 outline-none transition-all duration-150
        focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 ${className}`}
      {...props}
    />
  );
}

export default function AddCardPage() {
  const navigate = useNavigate();
  const { parentId } = useParams();
  const createCard = useCardStore((s) => s.createCard);
  const fetchCards = useCardStore((s) => s.fetchCards);
  const fetchChildCards = useCardStore((s) => s.fetchChildCards);
  const { timelineCards, fetchTimelineCards } = useTimelineCardStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    image: "",
    category: "",
    timelineId: 0,
    start_time: "",
    end_time: "",
  });
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchTimelineCards(); }, [fetchTimelineCards]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimelineChange = (e) =>
    setFormData((prev) => ({ ...prev, timelineId: Number(e.target.value) }));

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) return reject(new Error("Select an image file"));
      if (file.size > 5 * 1024 * 1024) return reject(new Error("Image must be < 5MB"));
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const handleFileSelect = async (file) => {
    if (!file) return;
    try {
      const base64 = await convertToBase64(file);
      setFormData((prev) => ({ ...prev, image: base64 }));
    } catch (err) { alert(err.message); }
  };

  const handleFileInputChange = (e) => handleFileSelect(e.target.files[0]);
  const handleClickUpload = () => fileInputRef.current?.click();
  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragEnter = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDragOver = useCallback((e) => { e.preventDefault(); }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, []);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) { e.preventDefault(); handleFileSelect(item.getAsFile()); break; }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setLoading(true);
    try {
      await createCard(formData, parentId);
      if (parentId) await fetchChildCards(parentId);
      else await fetchCards();
      navigate(-1);
    } finally { setLoading(false); }
  };

  const canSubmit = formData.title.trim() && !loading;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4" onPaste={handlePaste}>
      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-7 cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        {/* Page heading */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {parentId ? "Add Sub Card" : "Create New Card"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {parentId
              ? "This card will be nested under the parent card."
              : "Fill in the details below to get started."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* ── Section 1: Core Info ── */}
            <div className="px-7 py-6 border-b border-gray-100">
              <SectionLabel>Core Information</SectionLabel>

              {/* Title */}
              <div className="mb-5">
                <FieldLabel required>Title</FieldLabel>
                <InputBase
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter a descriptive title…"
                  required
                />
              </div>

              {/* Timeline + Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Timeline</FieldLabel>
                  <div className="relative">
                    <select
                      value={formData.timelineId}
                      onChange={handleTimelineChange}
                      className="w-full appearance-none px-3.5 py-2.5 pr-9 text-sm text-gray-900 bg-gray-50
                        border border-gray-200 rounded-xl outline-none cursor-pointer transition-all duration-150
                        focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    >
                      <option value={0}>Select timeline</option>
                      {timelineCards.map((t) => (
                        <option key={t._id} value={t.id}>{t.timeline}</option>
                      ))}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <FieldLabel>
                    <Tag size={13} className="text-gray-400" />
                    Category
                  </FieldLabel>
                  <InputBase
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Design, Dev…"
                  />
                </div>

                <div>
                  <FieldLabel>
                    <Tag size={13} className="text-gray-400" />
                    Start Time Period
                  </FieldLabel>
                  <InputBase
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                    placeholder="e.g. 1947"
                  />
                </div>
                <div>
                  <FieldLabel>
                    <Tag size={13} className="text-gray-400" />
                    End Time Period
                  </FieldLabel>
                  <InputBase
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    placeholder="e.g. 1947"
                  />
                </div>
              </div>
            </div>

            {/* ── Section 2: Description ── */}
            <div className="px-7 py-6 border-b border-gray-100">
              <SectionLabel>Description</SectionLabel>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
              />
            </div>

            {/* ── Section 3: Media & Link ── */}
            <div className="px-7 py-6">
              <SectionLabel>Media & Link</SectionLabel>

              {/* URL */}
              <div className="mb-5">
                <FieldLabel>
                  <Link2 size={13} className="text-gray-400" />
                  Reference URL
                </FieldLabel>
                <div className="relative">
                  <Link2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <InputBase
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <FieldLabel>Cover Image</FieldLabel>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="image/*"
                  className="hidden"
                />

                {formData.image ? (
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                    <img src={formData.image} alt="Preview" className="w-full h-44 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleClickUpload}
                        className="px-4 py-1.5 bg-white text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        <X size={13} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={handleClickUpload}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-150
                      ${isDragging
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50"
                      }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-500">
                      <Upload size={18} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">Click to upload or drag & drop</p>
                      <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP · Max 5 MB · Paste from clipboard</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-center justify-between px-7 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                <span className="text-red-500">*</span> Required field
              </p>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl
                    hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl
                    hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? "Creating…" : "Create Card"}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}