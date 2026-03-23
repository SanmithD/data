import { getRedis } from "../config/redis.js";
import cloudinary from "../config/cloudinary.js";
import { heroSliderModel } from "../models/HeroSlider.js";

/**
 * CREATE
 */
export const createHeroSlider = async (images = []) => {
  const redis = getRedis();

  const slider = new heroSliderModel({
    images,
  });

  const saved = await slider.save();

  // ❌ Invalidate cache
  await redis.del("heroSlider:latest");

  return saved;
};

/**
 * GET (WITH REDIS CACHE)
 */
export const getHeroSlider = async () => {
  const redis = getRedis();
  const cacheKey = "heroSlider:latest";

  try {
    // ✅ Check cache
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // ❌ Fetch from DB
    const slider = await heroSliderModel.findOne().sort({ createdAt: -1 });

    if (slider) {
      // ✅ Store in cache
      await redis.set(cacheKey, JSON.stringify(slider), {
        EX: 60, // 1 min cache (adjust as needed)
      });
    }

    return slider;
  } catch (error) {
    console.error("GetHeroSlider Error:", error);
    throw error;
  }
};

/**
 * UPDATE (replace images)
 */
export const updateHeroSlider = async (id, images = []) => {
  const redis = getRedis();

  const updated = await heroSliderModel.findByIdAndUpdate(
    id,
    { images },
    { returnDocument: "after" },
  );

  if (!updated) throw new Error("Hero slider not found");

  // ❌ Invalidate cache
  await redis.del("heroSlider:latest");

  return updated;
};

/**
 * DELETE (with Cloudinary cleanup)
 */
export const deleteHeroSlider = async (id) => {
  const redis = getRedis();

  const slider = await heroSliderModel.findById(id);

  if (!slider) throw new Error("Hero slider not found");

  // 🧹 Delete images from Cloudinary
  for (const img of slider.images) {
    if (img.public_id) {
      await cloudinary.uploader.destroy(img.public_id);
    }
  }

  await heroSliderModel.findByIdAndDelete(id);

  // ❌ Invalidate cache
  await redis.del("heroSlider:latest");

  return true;
};
