import mongoose from "mongoose";
import { getRedis } from "../config/redis.js";
import Card from "../models/Card.js";
import { AppError } from "../utils/AppError.js";
import mongodbAddFieldsForRegexNumberSearch from "../utils/mongodbAddFieldsForRegexNumberSearch.util.js";

class CardRepository {
  // Helper to clear list-related caches when data changes
  async #clearListCaches() {
    const redis = getRedis();
    const patterns = ["cards:all:*", "cards:timeline:*", "cards:children:*"];
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
    }
  }

  async createCard(data) {
    const redis = getRedis();
    const card = await Card.create(data);

    // Clear all list caches because a new card affects pagination/order
    await this.#clearListCaches();

    return card;
  }

  async addSubCard(parentId, childId) {
    const card = await Card.findByIdAndUpdate(
      parentId,
      { $push: { subCards: childId } },
      { returnDocument: "after" },
    );

    // Invalidate caches
    const redis = getRedis();
    await redis.del(`card:single:${parentId}`);
    await this.#clearListCaches();

    return card;
  }

  async getCards(page, limit) {
    const redis = getRedis();
    const cacheKey = `cards:all:${page}:${limit}`; // Use specific prefix

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const skip = (page - 1) * limit;

    const [cards, totalCards] = await Promise.all([
      Card.aggregate([
        { $match: { parentCard: null } },
        { $sort: { position: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "timelinecards",
            let: { timeId: "$timelineId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$id", "$$timeId"] } } },
              { $project: { id: 1, timeline: 1 } },
            ],
            as: "timelineData",
          },
        },
      ]),
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

  async getChildCards(cardId, page, limit) {
    const redis = getRedis();
    const cacheKey = `cards:children:${cardId}:${page}:${limit}`;

    try {
      // ❗ validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(cardId)) {
        throw new AppError("Invalid card ID", 400);
      }

      // cache
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const skip = (page - 1) * limit;
      const objectId = new mongoose.Types.ObjectId(cardId);

      // ❗ check parent exists
      const exists = await Card.exists({ _id: objectId });
      if (!exists) {
        throw new AppError("Parent card not found", 404);
      }

      const result = await Card.aggregate([
        { $match: { _id: objectId } },

        {
          $lookup: {
            from: "cards",
            let: { subIds: "$subCards" },
            pipeline: [
              { $match: { $expr: { $in: ["$_id", "$$subIds"] } } },
              { $sort: { position: 1 } },
            ],
            as: "children",
          },
        },

        {
          $lookup: {
            from: "timelinecards",
            let: { timeId: "$timelineId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$id", "$$timeId"] } } },
              { $project: { id: 1, timeline: 1 } },
            ],
            as: "timelineData",
          },
        },

        { $addFields: { children: { $ifNull: ["$children", []] } } },

        {
          $project: {
            children: { $slice: ["$children", skip, limit] },
            totalChildren: { $size: "$children" },
          },
        },
      ]);

      const total = result?.[0]?.totalChildren || 0;

      const response = {
        children: result?.[0]?.children || [],
        totalChildren: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      };

      await redis.set(cacheKey, JSON.stringify(response), { EX: 60 });

      return response;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("GetChildCards Repository Error:", error);
      throw new AppError("Failed to fetch child cards", 500);
    }
  }

  async getCardById(id) {
    const redis = getRedis();
    const cacheKey = `card:single:${id}`;

    try {
      // cache check
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const card = await Card.findById(id);

      if (!card) {
        throw new AppError("Card not found", 404);
      }

      await redis.set(cacheKey, JSON.stringify(card), { EX: 60 });

      return card;
    } catch (error) {
      // rethrow known errors
      if (error instanceof AppError) throw error;

      // unexpected errors
      console.error("Repository Error:", error);
      throw new AppError("Failed to fetch card", 500);
    }
  }

  async updateCard(id, data) {
    const card = await Card.findByIdAndUpdate(id, data, {
      returnDocument: "after",
    });

    // FIX: Clear the specific card cache and all list caches
    const redis = getRedis();
    await redis.del(`card:single:${id}`);
    await this.#clearListCaches();

    return card;
  }

  async deleteCard(id) {
    const redis = getRedis();

    try {
      const card = await Card.findById(id);

      if (!card) {
        throw new AppError("Card not found", 404);
      }

      // remove from parent if exists
      if (card.parentCard) {
        await Card.findByIdAndUpdate(card.parentCard, {
          $pull: { subCards: card._id },
        });
      }

      // delete card
      await Card.findByIdAndDelete(id);

      // clear caches
      await redis.del(`card:single:${id}`);
      await this.#clearListCaches();

      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("Delete Repository Error:", error);
      throw new AppError("Failed to delete card", 500);
    }
  }

  async updateCardPositions(updatedOrder) {
    const bulkOps = updatedOrder.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { position: item.position },
      },
    }));

    await Card.bulkWrite(bulkOps);

    const redis = getRedis();
    await this.#clearListCaches();

    // Clear individual card caches for those updated
    for (const item of updatedOrder) {
      await redis.del(`card:single:${item.id}`);
    }
  }

  async getCardsByTimelineId(page, limit, timeId) {
    const redis = getRedis();
    const timelineIdInt = parseInt(timeId.timeId || timeId, 10);
    const cacheKey = `cards:timeline:${timelineIdInt}:${page}:${limit}`; // Specific prefix

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const skip = (page - 1) * limit;
    const matchFilter = { timelineId: timelineIdInt, parentCard: null };

    const [cards, totalCards] = await Promise.all([
      Card.aggregate([
        { $match: matchFilter },
        { $sort: { position: 1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "timelinecards",
            let: { timeId: "$timelineId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$id", "$$timeId"] } } },
              { $project: { id: 1, timeline: 1 } },
            ],
            as: "timelineData",
          },
        },
      ]),
      Card.countDocuments(matchFilter),
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

  async searchCards({
    searchDetails = [],
    searchDetailsAnd = [],
    sortDetails = { sortKey: "position", sortType: 1 },
    page = 1,
    limit = 10,
  }) {
    // Search is usually not cached due to high variability of params,
    // but if you do, use a specific prefix like `cards:search:`
    const skip = (page - 1) * limit;
    const stageDocument = [];
    const stageCount = [];

    const numberStages = mongodbAddFieldsForRegexNumberSearch({
      searchDetails,
    });
    numberStages.forEach((s) => {
      stageDocument.push(s);
      stageCount.push(s);
    });

    if (searchDetails?.length) {
      const orConditions = searchDetails
        .map((el) => {
          if (
            el.basicSearchType === "number" ||
            el.basicSearchType === "string"
          )
            return { [el.basicSearchKey]: el.basicSearchValue };
          if (el.basicSearchType === "regex-string")
            return {
              [el.basicSearchKey]: new RegExp(el.basicSearchValue, "i"),
            };
          if (el.basicSearchType === "regex-number")
            return {
              [`regexnum_${el.basicSearchKey}`]: {
                $regex: new RegExp(`${el.basicSearchValue}`, "i"),
              },
            };
        })
        .filter(Boolean);

      if (orConditions.length) {
        const stage = { $match: { $or: orConditions } };
        stageDocument.push(stage);
        stageCount.push(stage);
      }
    }

    if (searchDetailsAnd?.length) {
      const andConditions = searchDetailsAnd
        .map((el) => {
          if (
            el.basicSearchType === "number" ||
            el.basicSearchType === "string"
          )
            return { [el.basicSearchKey]: el.basicSearchValue };
          if (el.basicSearchType === "regex-string")
            return {
              [el.basicSearchKey]: new RegExp(el.basicSearchValue, "i"),
            };
          if (el.basicSearchType === "regex-number")
            return {
              [`regexnum_${el.basicSearchKey}`]: {
                $regex: new RegExp(`${el.basicSearchValue}`, "i"),
              },
            };
        })
        .filter(Boolean);

      if (andConditions.length) {
        const stage = { $match: { $and: andConditions } };
        stageDocument.push(stage);
        stageCount.push(stage);
      }
    }

    const rootMatch = { $match: { parentCard: null } };
    stageDocument.push(rootMatch);
    stageCount.push(rootMatch);

    stageDocument.push({
      $sort: { [sortDetails.sortKey]: sortDetails.sortType },
    });
    stageDocument.push({ $skip: skip }, { $limit: limit });
    stageDocument.push({
      $lookup: {
        from: "timelinecards",
        let: { timeId: "$timelineId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$id", "$$timeId"] } } },
          { $project: { id: 1, timeline: 1 } },
        ],
        as: "timelineData",
      },
    });

    stageCount.push({ $count: "count" });

    const [docs, countResult] = await Promise.all([
      Card.aggregate(stageDocument),
      Card.aggregate(stageCount),
    ]);

    const total = countResult?.[0]?.count || 0;
    return {
      cards: docs,
      totalCards: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    };
  }
}

export default new CardRepository();
