import { create } from "zustand";
import api from "../api/axios";

export const useHeroSliderStore = create((set) => ({
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
}));
