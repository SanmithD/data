import toast from "react-hot-toast";
import { create } from "zustand";
import api from "../api/axios";

export const usePageStore = create((set) => ({
  pages: [],
  currentPageData: null,
  totalPagesCount: 0,
  totalPages: 0,
  currentPage: 1,
  loading: false,
  
  /*
  📚 FETCH PAGES (PAGINATED)
  */
  fetchPages: async (bookId, page = 1, limit = 10, append = false) => {
    set({ loading: true });

    try {
      const res = await api.get(
        `/books/book/${bookId}/pages?page=${page}&limit=${limit}`,
      );

      set((state) => ({
        pages: append ? [...state.pages, ...res.data.pages] : res.data.pages,
        totalPagesCount: res.data.totalPagesCount,
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
        loading: false,
      }));
    } catch (err) {
      console.error("Fetch pages error:", err);
      toast.error("Failed to load pages");
      set({ loading: false });
    }
  },

  /*
  📖 FETCH SINGLE PAGE (READER)
  */
  fetchPageByNumber: async (bookId, pageNumber) => {
    set({ loading: true });

    try {
      const res = await api.get(`/books/book/${bookId}/pages/${pageNumber}`);

      set({
        currentPageData: res.data.data,
        loading: false,
      });
    } catch (err) {
      console.error("Fetch page error:", err);
      toast.error("Failed to load page");
      set({ loading: false });
    }
  },

  /*
  ⏭️ FETCH LAST PAGE (RESUME READING)
  */
  fetchLastPage: async (bookId) => {
    try {
      const res = await api.get(`/books/book/${bookId}/pages-last`);

      set({
        currentPageData: res.data.data,
      });
    } catch (err) {
      console.error("Fetch last page error:", err);
      toast.error("Failed to fetch last page");
    }
  },

  /*
  🔢 FETCH PAGE COUNT
  */
  fetchPageCount: async (bookId) => {
    try {
      const res = await api.get(`/books/book/${bookId}/pages-count`);

      set({
        totalPagesCount: res.data.totalPages,
      });

      return res.data.totalPages;
    } catch (err) {
      console.error("Fetch page count error:", err);
      toast.error("Failed to fetch page count");
    }
  },

  /*
  🧹 RESET STATE (useful when switching books)
  */
  resetPages: () => {
    set({
      pages: [],
      currentPageData: null,
      totalPagesCount: 0,
      totalPages: 0,
      currentPage: 1,
    });
  },
}));
