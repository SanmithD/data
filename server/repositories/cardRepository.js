import mongoose from "mongoose";
import { getRedis } from "../config/redis.js";
import Card from "../models/Card.js";
import mongodbAddFieldsForRegexNumberSearch from "../utils/mongodbAddFieldsForRegexNumberSearch.util.js";

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
      Card.aggregate([
        {
          $match: { parentCard: null },
        },
        {
          $sort: { position: 1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: "timelinecards", // collection name
            let: { timeId: "$timelineId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$id", "$$timeId"],
                  },
                },
              },
              {
                $project: {
                  id: 1,
                  timeline: 1,
                },
              },
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
          let: { subIds: "$subCards" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$subIds"],
                },
              },
            },
            {
              $sort: { position: 1 },
            },
          ],
          as: "children",
        },
      },
      {
        $lookup: {
          from: "timelinecards",
          let: { timeId: "$timelineId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$id", "$$timeId"],
                },
              },
            },
            {
              $project: {
                id: 1,
                timeline: 1,
              },
            },
          ],
          as: "timelineData",
        },
      },

      {
        $addFields: {
          children: { $ifNull: ["$children", []] }, // ✅ ensure array
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

  async updateCardPositions(updatedOrder) {
    const bulkOps = updatedOrder.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { position: item.position },
      },
    }));

    await Card.bulkWrite(bulkOps);

    // optional: clear caches
    const redis = getRedis();
    // 🔥 clear ALL cards cache
    const keys = await redis.keys("cards:*");
    if (keys.length) {
      await redis.del(...keys);
    }
    const childKeys = await redis.keys("childCards:*");
    if (childKeys.length) {
      await redis.del(...childKeys);
    }

    updatedOrder.forEach((item) => redis.del(`card:${item.id}`));
  }

  async getCardsByTimelineId(page, limit, timeId) {
    const redis = getRedis();
    const timelineIdInt = parseInt(timeId.timeId || timeId, 10);

    // ✅ Fix 1: Include timelineId in cache key
    const cacheKey = `cards:${timelineIdInt}:${page}:${limit}`;

    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const skip = (page - 1) * limit;

    const matchFilter = { timelineId: timelineIdInt, parentCard: null };

    const [cards, totalCards] = await Promise.all([
      Card.aggregate([
        {
          $match: matchFilter,
        },
        {
          $sort: { position: 1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: "timelinecards",
            let: { timeId: "$timelineId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$id", "$$timeId"],
                  },
                },
              },
              {
                $project: {
                  id: 1,
                  timeline: 1,
                },
              },
            ],
            as: "timelineData",
          },
        },
      ]),
      // ✅ Fix 2: Use the same filter for counting
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
    // const redis = getRedis();
    // const cacheKey = `cards:search:${page}:${limit}:${JSON.stringify(
    //   searchDetails,
    // )}:${JSON.stringify(searchDetailsAnd)}`;

    // const cached = await redis.get(cacheKey);
    // if (cached) return JSON.parse(cached);

    const skip = (page - 1) * limit;

    const stageDocument = [];
    const stageCount = [];

    // ✅ REGEX NUMBER SUPPORT
    const numberStages = mongodbAddFieldsForRegexNumberSearch({
      searchDetails,
    });

    numberStages.forEach((s) => {
      stageDocument.push(s);
      stageCount.push(s);
    });

    // ✅ OR FILTER
    if (searchDetails?.length) {
      const orConditions = [];

      searchDetails.forEach((el) => {
        if (el.basicSearchType === "number") {
          orConditions.push({ [el.basicSearchKey]: el.basicSearchValue });
        }

        if (el.basicSearchType === "string") {
          orConditions.push({ [el.basicSearchKey]: el.basicSearchValue });
        }

        if (el.basicSearchType === "regex-string") {
          orConditions.push({
            [el.basicSearchKey]: new RegExp(el.basicSearchValue, "i"),
          });
        }

        if (el.basicSearchType === "regex-number") {
          orConditions.push({
            [`regexnum_${el.basicSearchKey}`]: {
              $regex: new RegExp(`${el.basicSearchValue}`, "i"),
            },
          });
        }
      });

      if (orConditions.length) {
        const stage = { $match: { $or: orConditions } };
        stageDocument.push(stage);
        stageCount.push(stage);
      }
    }

    // ✅ AND FILTER
    if (searchDetailsAnd?.length) {
      const andConditions = [];

      searchDetailsAnd.forEach((el) => {
        if (el.basicSearchType === "number") {
          andConditions.push({ [el.basicSearchKey]: el.basicSearchValue });
        }

        if (el.basicSearchType === "string") {
          andConditions.push({ [el.basicSearchKey]: el.basicSearchValue });
        }

        if (el.basicSearchType === "regex-string") {
          andConditions.push({
            [el.basicSearchKey]: new RegExp(el.basicSearchValue, "i"),
          });
        }

        if (el.basicSearchType === "regex-number") {
          andConditions.push({
            [`regexnum_${el.basicSearchKey}`]: {
              $regex: new RegExp(`${el.basicSearchValue}`, "i"),
            },
          });
        }
      });

      if (andConditions.length) {
        const stage = { $match: { $and: andConditions } };
        stageDocument.push(stage);
        stageCount.push(stage);
      }
    }

    // ✅ ONLY ROOT CARDS (same as your logic)
    const rootMatch = { $match: { parentCard: null } };
    stageDocument.push(rootMatch);
    stageCount.push(rootMatch);

    // ✅ SORT
    const sortStage = {
      $sort: { [sortDetails.sortKey]: sortDetails.sortType },
    };

    stageDocument.push(sortStage);
    stageCount.push(sortStage);

    // ✅ PAGINATION
    stageDocument.push({ $skip: skip });
    stageDocument.push({ $limit: limit });

    // ✅ LOOKUP (timeline)
    stageDocument.push({
      $lookup: {
        from: "timelinecards",
        let: { timeId: "$timelineId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$id", "$$timeId"] },
            },
          },
          {
            $project: { id: 1, timeline: 1 },
          },
        ],
        as: "timelineData",
      },
    });

    // ✅ COUNT
    stageCount.push({ $count: "count" });

    const [docs, countResult] = await Promise.all([
      Card.aggregate(stageDocument),
      Card.aggregate(stageCount),
    ]);

    const total = countResult?.[0]?.count || 0;

    const response = {
      cards: docs,
      totalCards: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    };

    // await redis.set(cacheKey, JSON.stringify(response), { EX: 60 });

    return response;
  }
}

export default new CardRepository();
