import mongoose from "mongoose";
import { getRedis } from "../config/redis.js";
import Card from "../models/Card.js";
import { AppError } from "../utils/AppError.js";
import TimelineModel from "../models/TimelineCard.js";
import mongodbAddFieldsForRegexNumberSearch from "../utils/mongodbAddFieldsForRegexNumberSearch.util.js";

function timePeriodToNumber(str) {
  if (!str) return null;
  if (typeof str === "number") return str;
  if (typeof str !== "string") return null;

  const s = str.trim().toUpperCase().replace(/\s+/g, "");

  // Match number + optional era (no space required now)
  const match = s.match(/^(-?\d+(?:\.\d+)?)(BCE|BC|CE|AD)?$/);
  if (!match) return null;

  let num = parseFloat(match[1]);
  const era = match[2];

  if (era === "BCE" || era === "BC") {
    num = -Math.abs(num);
  }

  return num;
}

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
    const startTime = timePeriodToNumber(data.start_time);
    const endTime = timePeriodToNumber(data.end_time);
    const card = await Card.create({
      ...data,
      start_time_num: startTime,
      end_time_num: endTime,
    });

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
    // 👇 compute numeric values if time fields exist
    if (data.start_time) {
      data.start_time_num = timePeriodToNumber(data.start_time);
    }

    if (data.end_time) {
      data.end_time_num = timePeriodToNumber(data.end_time);
    }

    const card = await Card.findByIdAndUpdate(id, data, {
      returnDocument: "after",
    });

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

    const currentTimeline = await TimelineModel.findOne({
      id: timelineIdInt,
    }).select("timeline position");

    const nextTimeline = await TimelineModel.findOne({
      position: { $gt: currentTimeline.position },
    })
      .sort({ position: 1 }) // nearest next
      .select("timeline position");

    const currentTime = timePeriodToNumber(currentTimeline.timeline);
    const nextTime = nextTimeline
      ? timePeriodToNumber(nextTimeline.timeline)
      : null;

    let rangeStart = currentTime;
    let rangeEnd = nextTime !== null ? nextTime : Infinity;

    // safety normalization
    if (rangeStart > rangeEnd) {
      [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
    }

    // ✅ overlap condition (THIS IS PERFECT ALREADY)
    const matchFilter = {
      parentCard: null,
      $or: [
        // 1️⃣ starts within range
        { start_time_num: { $gte: rangeStart, $lt: rangeEnd } },

        // 2️⃣ ends within range
        { end_time_num: { $gte: rangeStart, $lt: rangeEnd } },

        // 3️⃣ spans across entire range
        {
          start_time_num: { $lte: rangeStart },
          end_time_num: { $gte: rangeEnd },
        },
      ],
    };

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
    searchQuery,
    searchDetails,
    searchDetailsAnd,
    sortDetails = { sortKey: "position", sortType: 1 },
    page = 1,
    limit = 10,
    fromTime,
    toTime,
  }) {
    const skip = (page - 1) * limit;
    const stageDocument = [];
    const stageCount = [];

    if (fromTime && toTime) {
      const fromNum = timePeriodToNumber(String(fromTime)); // force string
      const toNum = timePeriodToNumber(String(toTime));

      const stage = {
        $match: {
          start_time_num: {
            $gte: fromNum,
          },
          end_time_num: {
            $lte: toNum,
          },
        },
      };

      stageDocument.push(stage);
      stageCount.push(stage);
    }

    // ── 2. Add fields for regex-number search ────────────────────────────────
    const numberStages = mongodbAddFieldsForRegexNumberSearch({
      searchDetails,
    });
    numberStages.forEach((s) => {
      stageDocument.push(s);
      stageCount.push(s);
    });

    // ── 3. parentCard / root filter (MUST come before text search) ───────────
    // ObjectId fields that must never be matched as plain strings
    const OBJECT_ID_FIELDS = ["parentCard", "_id", "userId"];

    const primarySearch = Array.isArray(searchDetails)
      ? searchDetails[0]
      : searchDetails;

    if (primarySearch?.basicSearchKey === "parentCard") {
      const stage = {
        $match: {
          $expr: {
            $eq: [
              "$parentCard",
              { $toObjectId: primarySearch.basicSearchValue },
            ],
          },
        },
      };
      stageDocument.push(stage);
      stageCount.push(stage);
    } else {
      const rootMatch = { $match: { parentCard: null } };
      stageDocument.push(rootMatch);
      stageCount.push(rootMatch);
    }

    // ── 4. searchDetails — OR conditions (skip ObjectId fields) ─────────────
    if (searchDetails?.length) {
      const orConditions = searchDetails
        .map((el) => {
          // ObjectId fields are already handled above — skip them here
          if (OBJECT_ID_FIELDS.includes(el.basicSearchKey)) return null;

          if (el.basicSearchType === "number")
            return { [el.basicSearchKey]: Number(el.basicSearchValue) };
          if (el.basicSearchType === "string")
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
          return null;
        })
        .filter(Boolean);

      if (orConditions.length) {
        const stage = { $match: { $or: orConditions } };
        stageDocument.push(stage);
        stageCount.push(stage);
      }
    }

    // ── 5. searchDetailsAnd — AND conditions (skip ObjectId fields) ──────────
    if (searchDetailsAnd?.length) {
      const andConditions = searchDetailsAnd
        .map((el) => {
          if (OBJECT_ID_FIELDS.includes(el.basicSearchKey)) return null;

          if (el.basicSearchType === "number")
            return { [el.basicSearchKey]: Number(el.basicSearchValue) };
          if (el.basicSearchType === "string")
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
          return null;
        })
        .filter(Boolean);

      if (andConditions.length) {
        const stage = { $match: { $and: andConditions } };
        stageDocument.push(stage);
        stageCount.push(stage);
      }
    }

    // ── 6. Free-text searchQuery across title / category / description ────────
    if (typeof searchQuery === "string" && searchQuery.trim() !== "") {
      const matchOrArr = [];
      const stringFields = ["title", "category", "description", "time_period"];
      const numberFields = ["id", "position", "time_period_num", "timelineId"];

      stringFields.forEach((field) => {
        matchOrArr.push({
          [field]: { $regex: searchQuery.trim(), $options: "i" },
        });
      });

      if (!isNaN(Number(searchQuery)) && searchQuery.trim() !== "") {
        numberFields.forEach((field) => {
          matchOrArr.push({ [field]: Number(searchQuery) });
        });
      }

      if (matchOrArr.length > 0) {
        const matchStage = { $match: { $or: matchOrArr } };
        stageDocument.push(matchStage);
        stageCount.push(matchStage);
      }
    }

    // ── 7. Sort / paginate / lookup ──────────────────────────────────────────
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

    // ── 8. Execute ───────────────────────────────────────────────────────────
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
