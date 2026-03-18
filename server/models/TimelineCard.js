import mongoose from "mongoose";

const timelineCardSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      default: 0,
    },
    cardId: {
      type: Number,
      default: 0,
    },
    position: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    timeline: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);
/*
AUTO INCREMENT ID & POSITION
*/
timelineCardSchema.pre("save", async function () {
  if (this.isNew) {
    const lastCard = await this.constructor.findOne().sort({ id: -1 });
    this.id = lastCard ? lastCard.id + 1 : 1;

    // ✅ If position not set, set to last + 1
    if (!this.position) {
      const lastPosition = await this.constructor
        .findOne()
        .sort({ position: -1 });
      this.position = lastPosition ? lastPosition.position + 1 : 1;
    }
  }
});

export default mongoose.model("TimelineCard", timelineCardSchema);
