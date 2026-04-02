import toast from "react-hot-toast";
import { create } from "zustand";
import api from "../api/axios";

export const useCardStore = create((set) => ({
  cards: [],
  childCards: [],
  cardDetails: null,
  loading: false,

  fetchCards: async (page = 1, limit = 10, append = false) => {
    set({ loading: true });
    try {
      const res = await api.get(`/cards?page=${page}&limit=${limit}`);
      
      set((state) => ({
        // If append is true (e.g., for a "Load More" button), add to existing array. 
        // Otherwise, replace the array (e.g., standard page navigation).
        cards: append ? [...state.cards, ...res.data.cards] : res.data.cards,
        totalCards: res.data.totalCards,
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
        loading: false,
      }));
    } catch (err) {
      console.error("Fetch cards error:", err);
      toast.error("Failed to fetch cards");
      set({ loading: false });
    }
  },

  fetchCardsByTimeline: async (page = 1, limit = 10, append = false, timeId) => {
    set({ loading: true });
    try {
      const res = await api.get(`/cardsByTimeline/${timeId}?page=${page}&limit=${limit}`);
      
      set((state) => ({
        // If append is true (e.g., for a "Load More" button), add to existing array. 
        // Otherwise, replace the array (e.g., standard page navigation).
        cards: append ? [...state.cards, ...res.data.cards] : res.data.cards,
        totalCards: res.data.totalCards,
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
        loading: false,
      }));
    } catch (err) {
      console.error("Fetch cards error:", err);
      toast.error("Failed to fetch cards");
      set({ loading: false });
    }
  },

  // ✅ OPTIMIZED: fetchChildCards with pagination support
  fetchChildCards: async (id, page = 1, limit = 10, append = false) => {
    set({ loading: true });
    try {
      const res = await api.get(`/card/${id}/children?page=${page}&limit=${limit}`);
      
      set((state) => ({
        childCards: append ? [...state.childCards, ...res.data.children] : res.data.children,
        totalChildren: res.data.totalChildren,
        loading: false,
      }));
    } catch (err) {
      console.error("Fetch children error:", err);
      toast.error("Failed to load child cards");
      set({ loading: false });
    }
  },

  fetchCardById: async (id) => {
    try {
      const res = await api.get(`/card/${id}`);
      set({ cardDetails: res.data.data });
    } catch (err) {
      console.error("Fetch card error:", err);
      toast.error("Failed to load card");
    }
  },
}));