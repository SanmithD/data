import mongoose from "mongoose";
import { Counter } from "./counter.js";

const bookSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },

    cover_image: {
      url: {
        type: String,
        default: null,
        unique: true,
        sparse: true, // only non-empty values must be unique
      },
      public_id: {
        type: String,
        // required: true,
      },
    },

    title: {
      type: String,
      required: true,
      trim: true,
      index: "text", // 🔍 full-text search
    },

    author: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      index: "text",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    totalPages: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      trim: true,
      index: true,
    },

    tags: {
      type: [String],
      index: true,
    },

    isPublished: {
      type: Number,
      default: 0,
      index: true,
    },

    publishedDate: Date,

    // soft delete (industry practice)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: Date,
  },
  { timestamps: true },
);

/*
🔢 AUTO INCREMENT (SAFE)
*/
bookSchema.pre("save", async function () {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "bookId" },
      { $inc: { value: 1 } },
      { returnDocument: "after", upsert: true },
    );

    this.id = counter.value;
  }
});

export const Book = mongoose.model("Book", bookSchema);
