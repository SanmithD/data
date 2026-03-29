import toast from "react-hot-toast";
import { create } from "zustand";
import api from "../api/axios";

export const useCardSearchStore = create((set) => ({
  searchResults: [],
  totalResults: 0,
  totalPages: 0,
  currentPage: 1,
  loading: false,

  /**
   * Search cards with advanced filters
   * searchDetails = [{ basicSearchKey, basicSearchValue, basicSearchType }]
   * searchDetailsAnd = [{ basicSearchKey, basicSearchValue, basicSearchType }]
   * sortDetails = { sortKey: 'position', sortType: 1 }
   */
  searchCards: async ({
    page = 1,
    limit = 10,
    searchQuery,
    searchDetails,
    searchDetailsAnd,
    sortDetails = { sortKey: "position", sortType: 1 },
    append = false,
    fromTime,
    toTime,
  }) => {
    set({ loading: true });

    try {
      const payload = {
        searchQuery,
        searchDetails,
        searchDetailsAnd,
        sortDetails,
        fromTime,
        toTime,
      };

      const res = await api.post(
        `/search?page=${page}&limit=${limit}`,
        payload,
      );

      set((state) => ({
        searchResults: append
          ? [...state.searchResults, ...res.data.cards]
          : res.data.cards,
        totalResults: res.data.totalCards,
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
        loading: false,
      }));
    } catch (err) {
      console.error("Search cards error:", err);
      toast.error("Failed to fetch search results");
      set({ loading: false });
    }
  },

  // Clear previous search
  clearSearch: () => {
    set({
      searchResults: [],
      totalResults: 0,
      totalPages: 0,
      currentPage: 1,
      loading: false,
    });
  },
}));
