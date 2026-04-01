import { getRedis } from "../config/redis.js";
import { Page } from "../models/book_page.model.js";
import { AppError } from "../utils/AppError.js";

class PageRepository {
  /*
  🔄 CLEAR PAGE CACHE
  */
  async #clearPageCaches(bookId) {
    const redis = getRedis();
    const patterns = [`pages:${bookId}:*`, `pages:*`];

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length) await redis.del(...keys);
    }
  }

  async getPages(bookId, page, limit) {
    const redis = getRedis();
    const cacheKey = `pages:${bookId}:${page}:${limit}`;

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const skip = (page - 1) * limit;

    const [pages, total] = await Promise.all([
      Page.find({ bookId: Number(bookId) })
        .sort({ pageNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Page.countDocuments({ bookId: Number(bookId) }),
    ]);

    const result = {
      pages,
      totalPagesCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    };

    await redis.set(cacheKey, JSON.stringify(result), { EX: 60 });

    return result;
  }

  /*
  📄 GET SINGLE PAGE
  */
  async getPageByNumber(bookId, pageNumber) {
    const redis = getRedis();
    const cacheKey = `page:${bookId}:${pageNumber}`;

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const page = await Page.findOne({
      bookId: Number(bookId),
      pageNumber: Number(pageNumber),
    }).lean();

    if (!page) throw new AppError("Page not found", 404);

    await redis.set(cacheKey, JSON.stringify(page), { EX: 60 });

    return page;
  }

  /*
  📄 GET LAST PAGE
  */
  async getLastPage(bookId) {
    return await Page.findOne({ bookId: Number(bookId) })
      .sort({ pageNumber: -1 })
      .lean();
  }

  /*
  📄 GET TOTAL PAGE COUNT
  */
  async getPageCount(bookId) {
    return await Page.countDocuments({ bookId: Number(bookId) });
  }
}

export default new PageRepository();
