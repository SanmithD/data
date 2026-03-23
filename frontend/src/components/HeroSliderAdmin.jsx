import { useEffect, useRef, useState } from "react";
import { useHeroSliderStore } from "../store/useHeroSliderStore";
import { Upload, Trash, Save, ArrowBigLeft, Cross, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HeroSliderAdmin() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const {
    slider,
    fetchSlider,
    createSlider,
    updateSlider,
    deleteSlider,
    removeImageFromSlider,
    loading,
  } = useHeroSliderStore();

  const [localImages, setLocalImages] = useState([]);

  useEffect(() => {
    fetchSlider();
  }, []);

  useEffect(() => {
    if (slider?.images) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalImages(slider.images);
    }
  }, [slider]);

  /**
   * Upload images
   */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        setLocalImages((prev) => [...prev, reader.result]);
      };

      reader.readAsDataURL(file);
    });
  };

  /**
   * Save
   */
  const handleSave = async () => {
    if (!slider) {
      await createSlider(localImages);
    } else {
      await updateSlider(slider._id, localImages);
    }
  };

  /**
   * Remove one image (NEW)
   */
  const handleDeleteImage = async (img) => {
    if (!slider) return;

    await removeImageFromSlider(slider._id, img);
  };

  /**
   * Remove all images (NEW)
   */
  const handleDeleteAll = async () => {
    if (slider && window.confirm("Delete all images?")) {
      await deleteSlider(slider._id);
      setLocalImages([]);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      
      {/* Back */}
      <button onClick={() => navigate(-1)}>
        <ArrowBigLeft />
      </button>

      <h1 className="text-3xl font-bold mb-6">Hero Slider Admin</h1>

      {/* Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => fileInputRef.current.click()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Upload size={18} /> Upload
        </button>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          <Save size={18} /> { loading ? 'Uploading': 'Save' }
        </button>

        <button
          onClick={handleDeleteAll}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          <Trash size={18} /> { loading ? 'Deleting' : 'Delete All' }
        </button>
      </div>

      {/* File Input */}
      <input
        type="file"
        multiple
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        hidden
      />

      {/* Images Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {localImages.length === 0 ? (
          <p className="text-gray-500">No images added.</p>
        ) : (
          localImages.map((img, index) => (
            <div key={index} className="relative group">
              
              <img
                src={typeof img === "string" ? img : img.url}
                className="w-full h-48 object-cover rounded-lg shadow"
              />

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteImage(img)}
                className="absolute top-2 cursor-pointer right-2 bg-red-500 text-white p-1 rounded-full"
              >
                <X size={14} />
              </button>

            </div>
          ))
        )}
      </div>
    </div>
  );
}