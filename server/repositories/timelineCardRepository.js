import { getRedis } from "../config/redis.js";
import TimelineCard from "../models/TimelineCard.js";

class TimelineCardRepository {
  // ✅ Create TimelineCard
  async createCard(data) {
    const redis = getRedis();

    const card = await TimelineCard.create(data);

    // Clear cache
    await redis.del("timelineCards:all");

    return card;
  }

  // ✅ Get ALL timeline cards (simple, no pagination)
  async getAllCards() {
    const redis = getRedis();
    const cacheKey = "timelineCards:all";

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const cards = await TimelineCard.find().sort({ position: 1 });

    await redis.set(cacheKey, JSON.stringify(cards), { EX: 60 });

    return cards;
  }

  // ✅ Get single TimelineCard
  async getCardById(id) {
    const redis = getRedis();
    const cacheKey = `timelineCard:${id}`;

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const card = await TimelineCard.findById(id);

    if (card) {
      await redis.set(cacheKey, JSON.stringify(card), { EX: 60 });
    }

    return card;
  }

  // ✅ Update TimelineCard
  async updateCard(id, data) {
    const redis = getRedis();

    const updated = await TimelineCard.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    });

    if (updated) {
      await redis.del(`timelineCard:${id}`);
      await redis.del("timelineCards:all");
    }

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
