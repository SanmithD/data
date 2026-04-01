import toast from "react-hot-toast";
import { create } from "zustand";
import api from "../api/axios";

export const useBookStore = create((set) => ({
  books: [],
  pages: [],
  bookDetails: null,
  loading: false,

  /*
  📚 FETCH BOOKS
  */
  fetchBooks: async (page = 1, limit = 10, append = false) => {
    set({ loading: true });
    try {
      const res = await api.get(`/books/books?page=${page}&limit=${limit}`);

      set((state) => ({
        books: append ? [...state.books, ...res.data.books] : res.data.books,
        totalBooks: res.data.totalBooks,
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
        loading: false,
      }));
    } catch (err) {
      console.error("Fetch books error:", err);
      toast.error("Failed to fetch books");
      set({ loading: false });
    }
  },

  /*
  📘 FETCH BOOK BY ID
  */
  fetchBookById: async (bookId) => {
    try {
      const res = await api.get(`/books/book/${bookId}`);
      set({ bookDetails: res.data.data });
    } catch (err) {
      console.error("Fetch book error:", err);
      toast.error("Failed to load book");
    }
  },

  /*
  📄 FETCH PAGES
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
  🔍 SEARCH BOOKS
  */
  searchBooks: async (filters) => {
    try {
      const res = await api.post("/books/books/search", filters);

      set({
        books: res.data.books,
        totalBooks: res.data.totalBooks,
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
      });
    } catch (err) {
      console.error("Search books error:", err);
      toast.error("Search failed");
    }
  },
}));
