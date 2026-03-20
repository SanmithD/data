import mongoose from "mongoose";

const pageTitleSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    parentCardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "pageTitle",
      default: null,
    },
  },
  { timestamps: true },
);

/*
AUTO INCREMENT ID
*/
pageTitleSchema.pre("save", async function () {
  if (this.isNew) {
    const lastItem = await this.constructor.findOne().sort({ id: -1 });

    this.id = lastItem ? lastItem.id + 1 : 1;
  }
});

export const pageTitleModel =  mongoose.model("pageTitle", pageTitleSchema);
