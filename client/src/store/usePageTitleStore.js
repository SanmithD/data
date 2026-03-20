import { create } from "zustand";
import api from "../api/axios";

export const usePageTitleStore = create((set) => ({
  pageTitles: [],
  loading: false,

  // FETCH BY PARENT ID
  fetchPageTitles: async (parentId = null) => {
    set({ loading: true });

    try {
      const url = parentId
        ? `/page/get/${parentId}`
        : `/page/get/null`;

      const res = await api.get(url);

      set({
        pageTitles: res.data.data,
        loading: false,
      });
    } catch (err) {
      console.error("Fetch pageTitles error:", err);
      // toast.error("Failed to fetch page titles");
      set({ loading: false });
    }
  },
}));