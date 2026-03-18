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
      set({ cardDetails: res.data });
    } catch (err) {
      console.error("Fetch card error:", err);
      toast.error("Failed to load card");
    }
  },

  // createCard: async (data, parentId = null) => {
  //   try {
  //     const res = await api.post("/card", { ...data, parentId });
  //     toast.success("Card created");
  //     return res.data;
  //   } catch (err) {
  //     console.error("Create card error:", err.response?.data || err.message);
  //     toast.error(err.response?.data?.error || "Create failed");
  //     throw err;
  //   }
  // },

  // deleteCard: async (id) => {
  //   try {
  //     await api.delete(`/card/${id}`);
  //     toast.success("Deleted");
  //     set((state) => ({
  //       cards: state.cards.filter((c) => c._id !== id),
  //       childCards: state.childCards.filter((c) => c._id !== id),
  //     }));
  //   } catch (err) {
  //     console.error("Delete error:", err);
  //     toast.error("Delete failed");
  //   }
  // },

  // ✅ NEW: updateCard function
  // updateCard: async (id, data) => {
  //   try {
  //     const res = await api.put(`/card/${id}`, data);
  //     toast.success("Card updated");

  //     // Update cardDetails if currently viewing this card
  //     set((state) => ({
  //       cardDetails: state.cardDetails?._id === id ? res.data : state.cardDetails,
  //       // Update the card in cards array
  //       cards: state.cards.map((c) => (c._id === id ? res.data : c)),
  //       // Update the card in childCards array
  //       childCards: state.childCards.map((c) => (c._id === id ? res.data : c)),
  //     }));

  //     return res.data;
  //   } catch (err) {
  //     console.error("Update card error:", err.response?.data || err.message);
  //     toast.error(err.response?.data?.error || "Update failed");
  //     throw err;
  //   }
  // },

  // reorderCards: async (updatedCards) => {
  //   try {
  //     // 1️⃣ Update local state immediately
  //     set({ cards: updatedCards });

  //     // 2️⃣ Prepare positions for backend
  //     const updatedOrder = updatedCards.map((card, index) => ({
  //       id: card._id,
  //       position: index + 1,
  //     }));

  //     // 3️⃣ Send to backend
  //     await api.put("/reorder", { updatedOrder });
  //     toast.success("Order updated");
  //   } catch (err) {
  //     console.error("Reorder cards error:", err.response?.data || err.message);
  //     toast.error("Failed to update order");
  //   }
  // },
}));