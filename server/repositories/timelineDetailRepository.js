import { getRedis } from "../config/redis.js";
import cloudinary from "../config/cloudinary.js";
import { timelineImageModel } from "../models/Timeline_Image.js";

export const createTimelineDetail = async (data) => {
  const redis = getRedis();

  const detail = await timelineImageModel.create(data);

  await redis.del(`timelineDetail:${data.timelineId}`);

  return detail;
};

export const getTimelineDetail = async (timelineId) => {
  const redis = getRedis();
  const cacheKey = `timelineDetail:${timelineId}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const detail = await timelineImageModel.findOne({ timelineId });

  if (detail) {
    await redis.set(cacheKey, JSON.stringify(detail), { EX: 60 });
  }

  return detail;
};

export const updateTimelineDetail = async (timelineId, data) => {
  const redis = getRedis();

  if (!timelineId || typeof timelineId !== "number") {
    throw new Error("Invalid timelineId");
  }

  const updated = await timelineImageModel.findOneAndUpdate(
    { timelineId },
    data,
    { returnDocument: "after" }
  );

  if (!updated) {
    await timelineImageModel.create({
      timelineId,
      ...data,
    });
  }

  await redis.del(`timelineDetail:${timelineId}`);

  return updated;
};

export const deleteTimelineDetail = async (timelineId) => {
  const redis = getRedis();

  const detail = await timelineImageModel.findOne({ timelineId });

  if (!detail) throw new Error("Timeline detail not found");

  // 🧹 delete image from Cloudinary
  if (detail.image?.public_id) {
    await cloudinary.uploader.destroy(detail.image.public_id);
  }

  await timelineImageModel.deleteOne({ timelineId });

  await redis.del(`timelineDetail:${timelineId}`);

  return true;
};
