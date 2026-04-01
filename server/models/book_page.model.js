import mongoose from "mongoose";
import { Counter } from "./counter.js";

const pageSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      index: true,
    },
    bookId: {
      type: Number,
      index: true,
    },

    pageNumber: {
      type: Number,
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
    },

    // optional enhancements
    wordCount: Number,

    // for future features like images, formatting
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true },
);

pageSchema.index({ bookId: 1, pageNumber: 1 }, { unique: true });

export const Page = mongoose.model("Page", pageSchema);
