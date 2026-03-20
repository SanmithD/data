import toast from "react-hot-toast";
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
    //   toast.error("Failed to fetch page titles");
      set({ loading: false });
    }
  },

  // CREATE
  createPageTitle: async (data) => {
    try {
      const res = await api.post("/page/create", data);

      toast.success("Page title created");

      set((state) => ({
        pageTitles: [...state.pageTitles, res.data.data],
      }));

      return res.data.data;
    } catch (err) {
      console.error("Create pageTitle error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Create failed");
      throw err;
    }
  },

  // UPDATE
  updatePageTitle: async (id, data) => {
    try {
      const res = await api.put(`/page/update/${id}`, data);

      toast.success("Page title updated");

      set((state) => ({
        pageTitles: state.pageTitles.map((item) =>
          item._id === id ? res.data.data : item
        ),
      }));

      return res.data.data;
    } catch (err) {
      console.error("Update pageTitle error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Update failed");
      throw err;
    }
  },

  // DELETE
  deletePageTitle: async (id) => {
    try {
      await api.delete(`/page/delete/${id}`);

      toast.success("Deleted");

      set((state) => ({
        pageTitles: state.pageTitles.filter((item) => item._id !== id),
      }));
    } catch (err) {
      console.error("Delete pageTitle error:", err);
      toast.error("Delete failed");
    }
  },
}));