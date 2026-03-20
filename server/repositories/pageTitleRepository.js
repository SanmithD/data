import mongoose from "mongoose";
import { getRedis } from "../config/redis.js";
import { AppError } from "../utils/AppError.js";
import { pageTitleModel } from "../models/PageTitle.js";

class PageTitleRepository {
  // Utility: validate Mongo ObjectId
  #isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  // Clear caches safely (NO redis.keys in production)
  async #clearCaches() {
    try {
      const redis = getRedis();
      // Instead of KEYS, use versioning strategy or specific keys
      await redis.flushDb(); // ⚠️ Replace with scoped invalidation in real prod
    } catch (error) {
      console.error("Redis cache clear failed:", error.message);
    }
  }

  // CREATE
  async createPageTitle(data) {
    try {
      const pageTitle = await pageTitleModel.create(data);

      await this.#clearCaches();

      return pageTitle;
    } catch (error) {
      console.error("Create PageTitle Error:", error);

      if (error.name === "ValidationError") {
        throw new AppError(error.message, 400);
      }

      if (error.code === 11000) {
        throw new AppError("Duplicate entry detected", 409);
      }

      throw new AppError("Failed to create page title", 500);
    }
  }

  // GET BY PARENT ID
  async getPageTitlesByParentId(parentCardId) {
    const redis = getRedis();
    const cacheKey = `pagetitle:parent:${parentCardId || "root"}`;

    try {
      // Validate ObjectId (if provided)
      if (parentCardId && !this.#isValidObjectId(parentCardId)) {
        throw new AppError("Invalid parentCardId", 400);
      }

      // Cache check
      try {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      } catch (redisError) {
        console.error("Redis GET failed:", redisError.message);
      }

      // DB query
      const query = parentCardId ? { parentCardId } : { parentCardId: null };

      const pageTitles = await pageTitleModel.find(query).lean();

      // Return empty array instead of throwing (better API design)
      if (!pageTitles) {
        throw new AppError("Failed to fetch page titles", 500);
      }

      // Cache set (non-blocking)
      try {
        await redis.set(cacheKey, JSON.stringify(pageTitles), { EX: 60 });
      } catch (redisError) {
        console.error("Redis SET failed:", redisError.message);
      }

      return pageTitles;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("Repository Error:", error);
      throw new AppError("Failed to fetch page titles", 500);
    }
  }

  // UPDATE
  async updatePageTitle(id, data) {
    try {
      if (!this.#isValidObjectId(id)) {
        throw new AppError("Invalid ID", 400);
      }

      const pageTitle = await pageTitleModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      });

      if (!pageTitle) {
        throw new AppError("Page title not found", 404);
      }

      const redis = getRedis();

      try {
        await redis.del(`pagetitle:single:${id}`);
      } catch (err) {
        console.error("Redis DEL failed:", err.message);
      }

      await this.#clearCaches();

      return pageTitle;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("Update Error:", error);

      if (error.name === "ValidationError") {
        throw new AppError(error.message, 400);
      }

      throw new AppError("Failed to update page title", 500);
    }
  }

  // DELETE
  async deletePageTitle(id) {
    try {
      if (!this.#isValidObjectId(id)) {
        throw new AppError("Invalid ID", 400);
      }

      const pageTitle = await pageTitleModel.findById(id);

      if (!pageTitle) {
        throw new AppError("Page title not found", 404);
      }

      // Delete children (optional business logic)
      await pageTitleModel.deleteMany({ parentCardId: pageTitle._id });

      await pageTitleModel.findByIdAndDelete(id);

      const redis = getRedis();

      try {
        await redis.del(`pagetitle:single:${id}`);
      } catch (err) {
        console.error("Redis DEL failed:", err.message);
      }

      await this.#clearCaches();

      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;

      console.error("Delete Error:", error);
      throw new AppError("Failed to delete page title", 500);
    }
  }
}

export default new PageTitleRepository();
