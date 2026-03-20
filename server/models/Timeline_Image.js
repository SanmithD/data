import mongoose from "mongoose";

const timelineDetailSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      default: 0,
    },
    timelineId: {
      type: Number,
      required: true,
      index: true,
    },
    image: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

/*
AUTO INCREMENT ID
*/
timelineDetailSchema.pre("save", async function () {
  if (this.isNew) {
    const lastItem = await this.constructor.findOne().sort({ id: -1 });
    this.id = lastItem ? lastItem.id + 1 : 1;
  }
});

export const timelineImageModel = mongoose.model(
  "TimelineDetail",
  timelineDetailSchema,
);
