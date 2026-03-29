import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true
    },

    title: {
      type: String,
      required: true
    },

    url: {
      type: String
    },

    description: {
      type: String
    },

    image: {
      type: String
    },

    category: {
      type: String
    },

    parentCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      default: null,
      index: true
    },

    subCards: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Card"
      }
    ],
    position: {
      type: Number,
      required: true,
      default: 0,
      index: true,
    },
    timelineId: {
      type: Number,
      default: 0
    },
    time_period: {
      type: String,
      default: ''
    },
    time_period_num: {
      type: Number,
      default: 0
    },
  },
  { timestamps: true }
);

/*
AUTO INCREMENT ID
*/
cardSchema.pre("save", async function () {
  if (this.isNew) {
    const lastCard = await this.constructor
      .findOne()
      .sort({ id: -1 });

    this.id = lastCard ? lastCard.id + 1 : 1;

    // ✅ If position not set, set to last + 1
    if (!this.position) {
      const lastPosition = await this.constructor.findOne().sort({ position: -1 });
      this.position = lastPosition ? lastPosition.position + 1 : 1;
    }
  }
});

export default mongoose.model("Card", cardSchema);