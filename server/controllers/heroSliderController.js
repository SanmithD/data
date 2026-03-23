import {
  createHeroSlider,
  getHeroSlider,
  updateHeroSlider,
  deleteHeroSlider,
} from "../repositories/heroSliderRepository.js";

import { uploadImage } from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";
import { getRedis } from "../config/redis.js";
import sharp from "sharp";

export const createSlider = async (req, res) => {
  try {
    const { images } = req.body;
    const redis = getRedis();
    const processedImages = [];

    for (const base64Image of images) {
      // ✅ Upload directly, let Cloudinary handle resize
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: "hero-slider",
        transformation: [
          { width: 1500, height: 500, crop: "fill", quality: 85 }
        ],
      });

      processedImages.push({
        url: result.secure_url,
        public_id: result.public_id,
      });
    }

    const slider = await createHeroSlider(processedImages);
    await redis.del("heroSlider:latest");

    res.status(201).json({ success: true, data: slider });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSlider = async (req, res) => {
  try {
    const redis = getRedis();
    const cacheKey = "heroSlider:latest";

    // ✅ Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: JSON.parse(cached),
      });
    }

    const slider = await getHeroSlider();

    if (slider) {
      await redis.set(cacheKey, JSON.stringify(slider), {
        EX: 60, // cache for 1 min
      });
    }

    res.status(200).json({
      success: true,
      data: slider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * UPDATE SLIDER
 */
export const updateSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;
    const redis = getRedis();

    const processedImages = [];

    for (const image of images) {
      // ✅ Already uploaded
      if (typeof image === "object" && image.url) {
        processedImages.push(image);
        continue;
      }

      // ✅ New base64 image
      if (typeof image === "string" && image.startsWith("data:image")) {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const buffer = Buffer.from(base64Data, "base64");

        const optimizedBuffer = await sharp(buffer)
          .resize(1500, 500, { fit: "fill" })
          .jpeg({ quality: 85 })
          .toBuffer();

        const processedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString(
          "base64",
        )}`;

        const uploaded = await uploadImage(processedBase64, "hero-slider");

        processedImages.push(uploaded);
      }
    }

    const slider = await updateHeroSlider(id, processedImages);

    // ❌ Clear cache
    await redis.del("heroSlider:latest");

    res.status(200).json({
      success: true,
      data: slider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE SLIDER
 */
export const deleteSlider = async (req, res) => {
  try {
    const { id } = req.params;
    const redis = getRedis();

    await deleteHeroSlider(id);

    // ❌ Clear cache
    await redis.del("heroSlider:latest");

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
