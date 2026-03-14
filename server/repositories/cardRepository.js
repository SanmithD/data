import mongoose from "mongoose";
import { getRedis } from "../config/redis.js";
import Card from "../models/Card.js";

class CardRepository {
  async createCard(data) {
    const redis = getRedis();

    const card = await Card.create(data);

    await redis.del("cards:1:10");

    return card;
  }

  async addSubCard(parentId, childId) {
    return await Card.findByIdAndUpdate(
      parentId,
      { $push: { subCards: childId } },
      { returnDocument: "after" },
    );
  }

  async getCards(page, limit) {
    const redis = getRedis();
    const cacheKey = `cards:${page}:${limit}`;

    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const skip = (page - 1) * limit;

    const [cards, totalCards] = await Promise.all([
      Card.find({ parentCard: null })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Card.countDocuments({ parentCard: null }),
    ]);

    const result = {
      cards,
      totalCards,
      totalPages: Math.ceil(totalCards / limit),
      currentPage: page,
      limit,
    };

    await redis.set(cacheKey, JSON.stringify(result), { EX: 60 });

    return result;
  }

  // ✅ OPTIMIZED: getChildCards adds totalPages calculation
  async getChildCards(cardId, page, limit) {
    const redis = getRedis();
    const cacheKey = `childCards:${cardId}:${page}:${limit}`;

    // check cache
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const skip = (page - 1) * limit;
    const objectId = new mongoose.Types.ObjectId(cardId);

    const result = await Card.aggregate([
      { $match: { _id: objectId } },
      {
        $lookup: {
          from: "cards",
          localField: "subCards",
          foreignField: "_id",
          as: "children",
        },
      },
      {
        $project: {
          children: { $slice: ["$children", skip, limit] },
          totalChildren: { $size: "$children" },
        },
      },
    ]);

    let response;

    if (!result || result.length === 0) {
      response = {
        children: [],
        totalChildren: 0,
        totalPages: 0,
        currentPage: page,
        limit,
      };
    } else {
      const total = result[0].totalChildren;

      response = {
        children: result[0].children,
        totalChildren: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      };
    }

    // store in redis (expire in 60 sec)
    await redis.set(cacheKey, JSON.stringify(response), { EX: 60 });

    return response;
  }

  async getCardById(id) {
    const redis = getRedis();
    const cacheKey = `card:${id}`;

    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const card = await Card.findById(id);

    await redis.set(cacheKey, JSON.stringify(card), { EX: 60 });

    return card;
  }

  async updateCard(id, data) {
    return await Card.findByIdAndUpdate(id, data, { returnDocument: "after" });
  }

  async deleteCard(id) {
    const redis = getRedis();

    const card = await Card.findById(id);

    if (card?.parentCard) {
      await Card.findByIdAndUpdate(card.parentCard, {
        $pull: { subCards: card._id },
      });

      // clear cached child cards of parent
      await redis.del(`childCards:${card.parentCard}:1:10`);
    }

    const deletedCard = await Card.findByIdAndDelete(id);

    // clear card cache
    await redis.del(`card:${id}`);

    // clear main cards list cache
    await redis.del(`cards:1:10`);

    return deletedCard;
  }
}

export default new CardRepository();
