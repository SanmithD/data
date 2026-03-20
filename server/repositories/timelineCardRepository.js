import mongoose from "mongoose";
import { getRedis } from "../config/redis.js";
import TimelineCard from "../models/TimelineCard.js";
import {
  createTimelineDetail,
  updateTimelineDetail,
} from "./timelineDetailRepository.js";

class TimelineCardRepository {
  // ✅ Create TimelineCard
  async createCard(data) {
    const redis = getRedis();

    const { timeline, image, note } = data;

    // ✅ Create main card
    const card = await TimelineCard.create({ timeline });

    // ✅ Create detail with same timelineId
    await createTimelineDetail({
      timelineId: card.id, // 👈 Number ID
      image: image || { url: "", public_id: "" },
      note: note || "",
    });

    // ✅ Clear cache
    await redis.del("timelineCards:all");

    return card;
  }

  // ✅ Get ALL timeline cards (simple, no pagination)
  async getAllCards() {
    const redis = getRedis();
    const cacheKey = "timelineCards:all";

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const cards = await TimelineCard.aggregate([
      {
        $sort: { position: 1 }
      },
      {
        $lookup: {
          from: 'timelinedetails',
          let: { timeline_id: '$id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$timelineId', '$$timeline_id']
                }
              }
            },
            {
              $project: {
                _id: 1,
                id: 1,
                image: 1,
                note: 1
              }
            }
          ],
          as: 'timeline_image'
        }
      }
    ])

    await redis.set(cacheKey, JSON.stringify(cards), { EX: 60 });

    return cards;
  }

  // ✅ Get single TimelineCard
  async getCardById(id) {
    const redis = getRedis();
    const cacheKey = `timelineCard:${id}`;

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const card = await TimelineCard.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id)
        }
      },
      {
        $sort: { position: 1 }
      },
      {
        $lookup: {
          from: 'timelinedetails',
          let: { timeline_id: '$id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$timelineId', '$$timeline_id']
                }
              }
            },
            {
              $project: {
                _id: 1,
                id: 1,
                image: 1,
                note: 1
              }
            }
          ],
          as: 'timeline_image'
        }
      }
    ])

    if (card) {
      await redis.set(cacheKey, JSON.stringify(card), { EX: 60 });
    }

    return card;
  }

  // ✅ Update TimelineCard
  async updateCard(id, data) {
    const redis = getRedis();

    const updated = await TimelineCard.findByIdAndUpdate(id, data, {
      returnDocument: "after", // ✅ important
      runValidators: true,
    });

    if (!updated) throw new Error("Timeline not found");

    // ✅ FIX: pass correct arguments
    await updateTimelineDetail(updated.id, {
      image: data.image || { url: "", public_id: "" },
      note: data.note || "",
    });

    await redis.del(`timelineCard:${id}`);
    await redis.del("timelineCards:all");

    return updated;
  }

  // ✅ Delete TimelineCard
  async deleteCard(id) {
    const redis = getRedis();

    const deleted = await TimelineCard.findByIdAndDelete(id);

    if (deleted) {
      await redis.del(`timelineCard:${id}`);
      await redis.del("timelineCards:all");
    }

    return deleted;
  }

  async updateTimeCardPositions(updatedOrder) {
    const bulkOps = updatedOrder.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { position: item.position },
      },
    }));

    await TimelineCard.bulkWrite(bulkOps);

    // optional: clear caches
    const redis = getRedis();
    await redis.del("cards:1:10");
    await redis.del("timelineCards:all");
    updatedOrder.forEach((item) => redis.del(`card:${item.id}`));
  }
}

export default new TimelineCardRepository();
