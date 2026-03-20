import toast from "react-hot-toast";
import { create } from "zustand";
import api from "../api/axios";

export const useTimelineDetailStore = create((set) => ({
  timelineDetail: null,
  loading: false,

  // ✅ Fetch detail by timelineId
  fetchTimelineDetail: async (timelineId) => {
    set({ loading: true });
    try {
      const res = await api.get(`/timeline-detail/${timelineId}`);

      set({
        timelineDetail: res.data.data,
        loading: false,
      });
    } catch (err) {
      console.error("Fetch timeline detail error:", err);
      toast.error("Failed to load timeline detail");
      set({ loading: false });
    }
  },

  // ✅ Create detail
  createTimelineDetail: async (data) => {
    try {
      const res = await api.post("/timeline-detail", data);

      toast.success("Detail created");

      set({
        timelineDetail: res.data.data,
      });

      return res.data.data;
    } catch (err) {
      console.error("Create detail error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Create failed");
      throw err;
    }
  },

  // ✅ Update detail
  updateTimelineDetail: async (timelineId, data) => {
    try {
      const res = await api.put(`/timeline-detail/${timelineId}`, data);

      toast.success("Detail updated");

      set({
        timelineDetail: res.data.data,
      });

      return res.data.data;
    } catch (err) {
      console.error("Update detail error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Update failed");
      throw err;
    }
  },

  // ✅ Delete detail
  deleteTimelineDetail: async (timelineId) => {
    try {
      await api.delete(`/timeline-detail/${timelineId}`);

      toast.success("Detail deleted");

      set({
        timelineDetail: null,
      });
    } catch (err) {
      console.error("Delete detail error:", err);
      toast.error("Delete failed");
    }
  },

  clearTimelineDetail: () => {
    set({ timelineDetail: null });
  },
}));
