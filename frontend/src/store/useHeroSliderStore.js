import { create } from "zustand";
import api from "../api/axios";
import toast from "react-hot-toast";

export const useHeroSliderStore = create((set, get) => ({
  slider: null,
  loading: false,
  error: null,

  fetchSlider: async () => {
    try {
      set({ loading: true });

      const res = await api.get("/hero-slider/get");

      set({
        slider: res.data.data || null,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  /**
   * CREATE SLIDER
   */
  createSlider: async (images) => {
    try {
      set({ loading: true });

      if(!images){
        return toast.error("Empty cannot be saved")
      }

      const res = await api.post("/hero-slider/create", {
        images,
      });

      set({
        slider: res.data.data,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  /**
   * UPDATE SLIDER
   */
  updateSlider: async (id, images) => {
    try {
      set({ loading: true });

      const res = await api.put(`/hero-slider/update/${id}`, {
        images,
      });

      set({
        slider: res.data.data,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  /**
   * DELETE SLIDER
   */
  deleteSlider: async (id) => {
    try {
      set({ loading: true });

      await api.delete(`/hero-slider/delete/${id}`);

      set({
        slider: null,
        loading: false,
      });
    } catch (err) {
      set({
        error: err.message,
        loading: false,
      });
    }
  },

  /**
   * ADD IMAGE TO EXISTING SLIDER
   */
  addImage: (imageUrl) => {
    const current = get().slider;

    if (!current) return;

    set({
      slider: {
        ...current,
        images: [...current.images, imageUrl],
      },
    });
  },

  /**
   * REMOVE IMAGE
   */
  removeImage: (index) => {
    const current = get().slider;

    if (!current) return;

    const updatedImages = current.images.filter((_, i) => i !== index);

    set({
      slider: {
        ...current,
        images: updatedImages,
      },
    });
  },

  removeImageFromSlider: async (sliderId, image) => {
  try {
    const current = get().slider;

    // Extract public_id
    const public_id = image.public_id;

    // Call backend
    const updatedImages = current.images.filter(
      (img) => img.public_id !== public_id
    );

    await api.put(`/hero-slider/update/${sliderId}`, {
      images: updatedImages,
    });

    set({
      slider: {
        ...current,
        images: updatedImages,
      },
    });
  } catch (err) {
    console.error(err);
  }
},
}));
