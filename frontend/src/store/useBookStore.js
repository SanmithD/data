import toast from "react-hot-toast";
import { create } from "zustand";
import api from "../api/axios";

export const useBookStore = create((set) => ({
  books: [],
  pages: [],
  bookDetails: null,
  loading: false,
  isDeleting: false,

  /*
  📚 FETCH BOOKS
  */
  fetchBooks: async (
    page_enabled = "y",
    page = 1,
    limit = 10,
    searchQuery = "",
    searchDetails = [],
    searchDetailsAnd = [],
    sortDetails = { sortKey: "createdAt", sortType: -1 },
    append = false,
  ) => {
    set({ loading: true });

    try {
      const payload = {
        page_enabled,
        page,
        limit,
        searchQuery,
        searchDetails,
        searchDetailsAnd,
        sortDetails,
      };

      const res = await api.post(`/books/books`, payload);

      set((state) => ({
        books: append ? [...state.books, ...res.data.books] : res.data.books,
        totalBooks: res.data.totalBooks,
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
        loading: false,
      }));

      return res.data;
    } catch (err) {
      console.error("Fetch books error:", err);
      toast.error("Failed to fetch books");
      set({ loading: false });
      throw err;
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
  ➕ CREATE BOOK
  */
  createBook: async (data) => {
    try {
      const res = await api.post("/books/book", data);
      toast.success("Book created");
      return res.data;
    } catch (err) {
      console.error("Create book error:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Create failed");
      throw err;
    }
  },

  updateBook: async (bookId, data) => {
    try {
      const res = await api.put(`/books/book/${bookId}`, data);
      toast.success("Book updated");

      set((state) => ({
        bookDetails:
          state.bookDetails?.id === bookId ? res.data : state.bookDetails,

        books: state.books.map((b) => (b.id === bookId ? res.data : b)),
      }));

      return res.data;
    } catch (err) {
      console.error("Update book error:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Update failed");
      throw err;
    }
  },

  deleteBook: async (bookId) => {
    set({ isDeleting: true });
    try {
      await api.delete(`/books/book/${bookId}`);
      toast.success("Deleted");

      set((state) => ({
        books: state.books.filter((b) => b.id !== bookId),
      }));
      set({ bookDetails: null, isDeleting: false });
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Delete failed");
    } finally {
      set({ isDeleting: false });
    }
  },

  /*
  📄 ADD PAGE
  */
  addPage: async (bookId, data) => {
    try {
      const res = await api.post(`/books/book/${bookId}/page`, data);
      toast.success("Page added");
      return res.data;
    } catch (err) {
      console.error("Add page error:", err);
      toast.error("Failed to add page");
      throw err;
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
  ✏️ UPDATE PAGE
  */
  updatePage: async (bookId, pageNumber, data) => {
    try {
      const res = await api.put(`/books/book/${bookId}/page/${pageNumber}`, data);

      toast.success("Page updated");

      set((state) => ({
        pages: state.pages.map((p) =>
          p.pageNumber === pageNumber ? res.data : p,
        ),
      }));

      return res.data;
    } catch (err) {
      console.error("Update page error:", err);
      toast.error("Update failed");
      throw err;
    }
  },

  /*
  ❌ DELETE PAGE
  */
  deletePage: async (bookId, pageNumber) => {
    try {
      await api.delete(`/books/book/${bookId}/page/${pageNumber}`);
      toast.success("Page deleted");

      set((state) => ({
        pages: state.pages.filter((p) => p.pageNumber !== pageNumber),
      }));
    } catch (err) {
      console.error("Delete page error:", err);
      toast.error("Delete failed");
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
