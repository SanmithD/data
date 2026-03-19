import { Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCardStore } from "../store/cardStore";
import { useTimelineCardStore } from "../store/timelineCardStore";
import RichTextEditor from "./RichTextEditor";

export default function AddCardModal({ parentId, isOpen, onClose }) {
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
  });

  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTimelineCards();
  }, [fetchTimelineCards]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimelineChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      timelineId: Number(e.target.value),
    }));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/"))
        return reject(new Error("Select an image file"));
      if (file.size > 5 * 1024 * 1024)
        return reject(new Error("Image must be <5MB"));

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    try {
      const base64 = await convertToBase64(file);
      setFormData((prev) => ({ ...prev, image: base64 }));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleFileInputChange = (e) => handleFileSelect(e.target.files[0]);
  const handleClickUpload = () => fileInputRef.current?.click();

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, []);

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        handleFileSelect(item.getAsFile());
        break;
      }
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

      setFormData({
        title: "",
        description: "",
        url: "",
        image: "",
        category: "",
        timelineId: 0,
      });

      if (fileInputRef.current) fileInputRef.current.value = "";

      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onPaste={handlePaste}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
          <div>
            <h2 className="text-xl font-bold text-white">
              {parentId ? "Add Sub Card" : "Create New Card"}
            </h2>
            <p className="text-blue-100 text-sm mt-0.5">
              {parentId
                ? "This card will be nested under the parent"
                : "Fill in the details below"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 max-h-[70vh] overflow-y-auto"
        >

          {/* TITLE */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter card title..."
              required
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* TIMELINE */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Timeline
            </label>
            <select
              value={formData.timelineId}
              onChange={handleTimelineChange}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value={0}>Select Timeline</option>
              {timelineCards.map((t) => (
                <option key={t._id} value={t.id}>
                  {t.timeline}
                </option>
              ))}
            </select>
          </div>

          {/* DESCRIPTION (TIPTAP) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description
            </label>

            <RichTextEditor
              value={formData.description}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, description: value }))
              }
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              URL
            </label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com"
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* IMAGE */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Image
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />

            {formData.image ? (
              <div className="relative group rounded-lg overflow-hidden border-2">
                <img
                  src={formData.image}
                  className="w-full h-48 object-cover"
                />

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex justify-center items-center gap-3">
                  <button onClick={handleClickUpload} className="bg-white px-3 py-1 rounded">
                    Change
                  </button>
                  <button onClick={handleRemoveImage} className="bg-red-500 text-white px-3 py-1 rounded">
                    Remove
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
                className={`h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer ${
                  isDragging ? "border-blue-500 bg-blue-50" : ""
                }`}
              >
                <Upload className="text-gray-400" />
                <p className="text-sm">Click or drag image</p>
              </div>
            )}
          </div>

          {/* CATEGORY */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Category
            </label>
            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3">
            <button onClick={onClose} type="button" className="px-4 py-2 bg-gray-100 rounded">
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
} 