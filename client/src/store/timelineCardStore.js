import toast from "react-hot-toast";
import { create } from "zustand";
import api from "../api/axios";

export const useTimelineCardStore = create((set) => ({
  timelineCards: [],
  timelineCardDetails: null,
  loading: false,

  // ✅ Fetch ALL TimelineCards
  fetchTimelineCards: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/getTimeline");

      set({
        timelineCards: res.data,
        loading: false,
      });
    } catch (err) {
      console.error("Fetch TimelineCards error:", err);
      toast.error("Failed to fetch timeline cards");
      set({ loading: false });
    }
  },

  // ✅ Fetch single TimelineCard
  fetchTimelineCardById: async (id) => {
    try {
      const res = await api.get(`/getTimeline/${id}`);
      set({ timelineCardDetails: res.data });
    } catch (err) {
      console.error("Fetch timeline card error:", err);
      toast.error("Failed to load timeline card");
    }
  },

  // ✅ Create TimelineCard
  createTimelineCard: async (data) => {
    try {
      const res = await api.post("/insertTimeline", data);
      toast.success("Timeline created");

      set((state) => ({
        timelineCards: [...state.timelineCards, res.data],
      }));

      return res.data;
    } catch (err) {
      console.error(
        "Create timeline error:",
        err.response?.data || err.message,
      );
      toast.error(err.response?.data?.error || "Create failed");
      throw err;
    }
  },

  // ✅ Update TimelineCard
  updateTimelineCard: async (id, data) => {
    try {
      const res = await api.put(`/updateTimeline/${id}`, data);
      toast.success("Timeline updated");

      set((state) => ({
        timelineCardDetails:
          state.timelineCardDetails?._id === id
            ? res.data
            : state.timelineCardDetails,

        timelineCards: state.timelineCards.map((t) =>
          t._id === id ? res.data : t,
        ),
      }));

      return res.data;
    } catch (err) {
      console.error(
        "Update timeline error:",
        err.response?.data || err.message,
      );
      toast.error(err.response?.data?.error || "Update failed");
      throw err;
    }
  },

  // ✅ Delete TimelineCard
  deleteTimelineCard: async (id) => {
    try {
      await api.delete(`/deleteTimeline/${id}`);
      toast.success("Timeline deleted");

      set((state) => ({
        timelineCards: state.timelineCards.filter((t) => t._id !== id),
        timelineCardDetails:
          state.timelineCardDetails?._id === id
            ? null
            : state.timelineCardDetails,
      }));
    } catch (err) {
      console.error("Delete timeline error:", err);
      toast.error("Delete failed");
    }
  },

  reorderTimeCards: async (updatedCards) => {
      try {
        // 1️⃣ Update local state immediately
        set({ timelineCards: updatedCards });
  
        // 2️⃣ Prepare positions for backend
        const updatedOrder = updatedCards.map((time, index) => ({
          id: time._id,
          position: index + 1,
        }));
  
        // 3️⃣ Send to backend
        await api.put("/timeline-reorder", { updatedOrder });
        toast.success("Order updated");
      } catch (err) {
        console.error("Reorder cards error:", err.response?.data || err.message);
        toast.error("Failed to update order");
      }
    },
}));
