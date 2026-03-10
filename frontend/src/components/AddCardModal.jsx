import { ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useCardStore } from "../store/cardStore";

export default function AddCardModal({ parentId, isOpen, onClose }) {
  const createCard = useCardStore((s) => s.createCard);
  const fetchCards = useCardStore((s) => s.fetchCards);
  const fetchChildCards = useCardStore((s) => s.fetchChildCards);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    image: "",
    category: "",
  });

  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Convert file to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        reject(new Error("Please select an image file"));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error("Image must be less than 5MB"));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle file selection
  const handleFileSelect = async (file) => {
    if (!file) return;

    try {
      const base64 = await convertToBase64(file);
      setFormData((prev) => ({ ...prev, image: base64 }));
    } catch (error) {
      alert(error.message);
    }
  };

  // Handle input file change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  // Handle click to select
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and Drop handlers
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

    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, []);

  // Handle paste from clipboard
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        handleFileSelect(file);
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

      if (parentId) {
        await fetchChildCards(parentId);
      } else {
        await fetchCards();
      }

      setFormData({
        title: "",
        description: "",
        url: "",
        image: "",
        category: "",
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onPaste={handlePaste}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         outline-none transition-all placeholder:text-gray-400"
            />
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         outline-none transition-all resize-none placeholder:text-gray-400"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Image Upload - Drag & Drop + Click */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Image
            </label>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />

            {formData.image ? (
              /* Image Preview */
              <div className="relative group rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                                transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleClickUpload}
                    className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm
                               font-medium hover:bg-gray-100 transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm
                               font-medium hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>

                {/* File size indicator */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 
                                text-white text-xs rounded-full">
                  {(formData.image.length * 0.75 / 1024).toFixed(0)} KB
                </div>
              </div>
            ) : (
              /* Drop Zone */
              <div
                onClick={handleClickUpload}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`
                  w-full h-40 border-2 border-dashed rounded-lg cursor-pointer
                  flex flex-col items-center justify-center gap-2
                  transition-all duration-200
                  ${isDragging
                    ? "border-blue-500 bg-blue-50 scale-[1.02]"
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  }
                `}
              >
                {isDragging ? (
                  <>
                    <Upload size={32} className="text-blue-500 animate-bounce" />
                    <p className="text-sm font-medium text-blue-600">
                      Drop image here
                    </p>
                  </>
                ) : (
                  <>
                    <ImageIcon size={32} className="text-gray-400" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">
                        <span className="text-blue-600 hover:text-blue-700">
                          Click to upload
                        </span>
                        {" "}or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, GIF, WEBP (max 5MB)
                      </p>
                      <p className="text-xs text-gray-400">
                        You can also paste from clipboard
                      </p>
                    </div>
                  </>
                )}
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
              placeholder="e.g. Design, Development, Marketing"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700
                         bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="px-5 py-2.5 text-sm font-medium text-white
                         bg-gradient-to-r from-blue-600 to-indigo-600
                         hover:from-blue-700 hover:to-indigo-700
                         rounded-lg transition-all shadow-md hover:shadow-lg
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Card"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}