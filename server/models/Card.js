import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
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
      default: null
    },

    subCards: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Card"
      }
    ]
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
  }
});

export default mongoose.model("Card", cardSchema);