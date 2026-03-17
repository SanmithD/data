import { ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import { useCardStore } from "../store/cardStore";
import { useTimelineCardStore } from "../store/timelineCardStore"; // Import timeline store

export default function AddCardModal({ parentId, isOpen, onClose }) {
  const createCard = useCardStore((s) => s.createCard);
  const fetchCards = useCardStore((s) => s.fetchCards);
  const fetchChildCards = useCardStore((s) => s.fetchChildCards);

  const { timelineCards, fetchTimelineCards } = useTimelineCardStore(); // Get timeline cards

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    image: "",
    category: "",
    timelineId: 0, // Selected timeline ID
  });

  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch timelines on mount
  useEffect(() => {
    fetchTimelineCards();
  }, [fetchTimelineCards]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle timeline select
  const handleTimelineChange = (e) => {
    setFormData((prev) => ({ ...prev, timelineId: Number(e.target.value) }));
  };

  // Convert file to Base64
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
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
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
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 max-h-[70vh] overflow-y-auto"
        >
          {/* Title */}
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Timeline Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Timeline
            </label>
            <select
              value={formData.timelineId}
              onChange={handleTimelineChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value={0}>Select Timeline</option>
              {timelineCards.map((t) => (
                <option key={t._id} value={t.id}>
                  {t.timeline}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe this card..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-gray-400"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Image Upload - Drag & Drop + Click */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Image
            </label>

            {/* Hidden input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />

            {formData.image ? (
              // ✅ Preview
              <div className="relative group rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleClickUpload}
                    className="px-3 py-1.5 bg-white rounded-lg text-sm"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              // ✅ Drop zone
              <div
                onClick={handleClickUpload}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`w-full h-40 border-2 border-dashed rounded-lg cursor-pointer
        flex flex-col items-center justify-center gap-2 transition
        ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
              >
                <Upload size={28} className="text-gray-400" />
                <p className="text-sm text-gray-600">
                  Click or drag image here
                </p>
                <p className="text-xs text-gray-400">PNG, JPG (max 5MB)</p>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g. Design, Development"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
