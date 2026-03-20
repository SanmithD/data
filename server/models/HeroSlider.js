import mongoose from "mongoose";

const heroSliderSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
    },

    images: [
      {
        url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

/*
AUTO INCREMENT ID
*/
heroSliderSchema.pre("save", async function () {
  if (this.isNew) {
    const lastDoc = await this.constructor.findOne().sort({ id: -1 });

    this.id = lastDoc ? lastDoc.id + 1 : 1;
  }
});

export const heroSliderModel = mongoose.model("HeroSlider", heroSliderSchema);
