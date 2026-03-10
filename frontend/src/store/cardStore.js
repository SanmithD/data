// store/cardStore.js
import toast from "react-hot-toast";
import { create } from "zustand";
import api from "../api/axios";

export const useCardStore = create((set) => ({
  cards: [],
  childCards: [],
  cardDetails: null,
  loading: false,

  fetchCards: async () => {
    try {
      const res = await api.get("/cards");
      set({ cards: res.data });
    } catch (err) {
      console.error("Fetch cards error:", err);
      toast.error("Failed to fetch cards");
    }
  },

  fetchCardById: async (id) => {
    try {
      const res = await api.get(`/card/${id}`);
      set({ cardDetails: res.data });
    } catch (err) {
      console.error("Fetch card error:", err);
      toast.error("Failed to load card");
    }
  },

  fetchChildCards: async (id) => {
    try {
      const res = await api.get(`/card/${id}/children`);
      set({ childCards: res.data[0]?.children || [] });
    } catch (err) {
      console.error("Fetch children error:", err);
      toast.error("Failed to load child cards");
    }
  },

  createCard: async (data, parentId = null) => {
    try {
      const res = await api.post("/card", { ...data, parentId });
      console.log("Create response:", res.data);
      toast.success("Card created");
      return res.data;
    } catch (err) {
      console.error("Create card error:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Create failed");
      throw err;
    }
  },

  deleteCard: async (id) => {
    try {
      await api.delete(`/card/${id}`);
      toast.success("Deleted");
      set((state) => ({
        cards: state.cards.filter((c) => c._id !== id),
      }));
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Delete failed");
    }
  },
}));