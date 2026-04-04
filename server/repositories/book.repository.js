import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";
import { getRedis } from "../config/redis.js";
import { Book } from "../models/book.js";
import { Page } from "../models/book_page.model.js";
import { Counter } from "../models/counter.js";
import { AppError } from "../utils/AppError.js";
import {
  commonSearchOrNumber,
  commonSearchOrString,
  mongodbAddFieldsForRegexNumberSearchByFieldsArr,
  mongodbAddFieldsForRegexNumberSearchNew,
} from "../utils/mongodbAddFieldsForRegexNumberSearch.util.js";
import { uploadImage } from "../utils/uploadToCloudinary.js";

class BookRepository {
  commonSearchOrCondition = async ({ searchQuery }) => {
    try {
      const stageMatchOr = [];
      let additionalStages = [];

      const regexFieldsNum = ["id", "price", "totalPages", "isPublished"];

      const regexFieldsStr = [
        "title",
        "author",
        "description",
        "currency",
        "category",
        "tags",
      ];

      // step 1: add fields for regex number
      // stage -> addFields -> regex number
      if (typeof searchQuery === "string") {
        if (isNaN(parseInt(searchQuery)) === false) {
          // stage -> addFields -> searchQuery
          additionalStages = mongodbAddFieldsForRegexNumberSearchByFieldsArr({
            fieldsArr: regexFieldsNum,
          });
        }
      }

      // step 2: for regex number
      // stage -> match -> or -> searchQuery -> regex number
      if (typeof searchQuery === "string") {
        if (isNaN(parseInt(searchQuery)) === false) {
          // stage -> addFields -> searchQuery
          const searchQueryNum = parseInt(searchQuery);
          const regexFieldsNumNewName = regexFieldsNum.map((element) => {
            return `regexnum_${element}`;
          });
          const resultOrNumber = commonSearchOrNumber({
            fields: regexFieldsNumNewName,
            searchQuery: `${searchQueryNum}`,
          });
          if (resultOrNumber.length > 0) {
            stageMatchOr.push(...resultOrNumber);
          }
        }
      }

      // step 3: for regex string
      // stage -> match -> or -> searchQuery -> regex string
      if (typeof searchQuery === "string") {
        const resultOrString = commonSearchOrString({
          fields: regexFieldsStr,
          searchQuery,
        });
        if (resultOrString.length > 0) {
          stageMatchOr.push(...resultOrString);
        }
      }

      return {
        matchOrArr: stageMatchOr,
        additionalStages: additionalStages,
      };
    } catch (error) {
      return {
        matchOrArr: [],
        additionalStages: [],
      };
    }
  };

  async #clearListCaches() {
    const redis = getRedis();
    const patterns = ["books:*", "pages:*"];

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length) await redis.del(...keys);
    }
  }

  /*
  📘 CREATE BOOK
  */
  async createBook(data) {
    const { pages, cover_image, ...bookData } = data;

    // ✅ New base64 image
    let cover_image_url = {
      url: null,
      public_id: null,
    };
    if (
      typeof cover_image === "string" &&
      cover_image.startsWith("data:image")
    ) {
      const base64Data = cover_image.replace(/^data:image\/\w+;base64,/, "");

      const buffer = Buffer.from(base64Data, "base64");

      const optimizedBuffer = await sharp(buffer)
        .jpeg({ quality: 85 })
        .toBuffer();

      const processedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString(
        "base64",
      )}`;

      const uploaded = await uploadImage(processedBase64, "book-covers");

      cover_image_url.url = uploaded.url;
      cover_image_url.public_id = uploaded.public_id;
    }

    const bookDataWithImage = {
      ...bookData,
      cover_image: cover_image_url,
    };

    const book = await Book.create(bookDataWithImage);

    // If pages are provided, create them
    if (pages?.length) {
      const counter = await Counter.findOneAndUpdate(
        { name: "pageId" },
        { $inc: { value: pages.length } }, // reserve IDs in bulk
        { returnDocument: "after", upsert: true },
      );

      const startId = counter.value - pages.length + 1;

      const pageDocs = pages.map((p, idx) => {
        const page = {
          id: startId + idx, // assign reserved ID
          bookId: book.id,
          pageNumber: idx + 1,
          content: p.content,
          title: p.title || `Page ${idx + 1}`,
        };
        return page;
      });

      await Page.insertMany(pageDocs);
      book.totalPages = pages.length;
      await book.save();
    }

    await this.#clearListCaches();
    return book;
  }

  async getBooks({
    searchDetails = [],
    page_enabled = "y",
    page = 1,
    limit = 10,
    sortDetails = { sortKey: "createdAt", sortType: -1 },
    searchDetailsAnd = [],
    searchQuery = "",
  }) {
    const redis = getRedis();
    const cacheKey = `books:all:${page_enabled}:${page}:${limit}:${JSON.stringify(searchDetails)}:${JSON.stringify(searchDetailsAnd)}:${JSON.stringify(sortDetails)}:${searchQuery}`;

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const stageDocument = [];
    const stageCount = [];
    let tempStage;
    let resultCount = null;

    const stagesNumber = mongodbAddFieldsForRegexNumberSearchNew({
      searchDetails,
      searchDetailsAnd,
    });

    stagesNumber.forEach((tempStageNumber) => {
      stageDocument.push(tempStageNumber);
      stageCount.push(tempStageNumber);
    });

    if (Array.isArray(searchDetailsAnd) && searchDetailsAnd.length > 0) {
      const stageMatchAnd = [];

      for (let index = 0; index < searchDetailsAnd.length; index++) {
        const element = searchDetailsAnd[index];

        if (
          element.basicSearchType === "number" &&
          typeof element.basicSearchValue === "number"
        ) {
          const tempObjNumber = {};
          tempObjNumber[element.basicSearchKey] = element.basicSearchValue;
          stageMatchAnd.push(tempObjNumber);
        }

        if (
          element.basicSearchType === "string" &&
          typeof element.basicSearchValue === "string"
        ) {
          const tempObjString = {};
          tempObjString[element.basicSearchKey] = element.basicSearchValue;
          stageMatchAnd.push(tempObjString);
        }

        if (
          element.basicSearchType === "regex-string" &&
          typeof element.basicSearchValue === "string"
        ) {
          const tempObjRegexString = {};
          tempObjRegexString[element.basicSearchKey] = new RegExp(
            element.basicSearchValue,
            "i",
          );
          stageMatchAnd.push(tempObjRegexString);
        }

        if (
          element.basicSearchType === "regex-number" &&
          typeof element.basicSearchValue === "number"
        ) {
          const tempObjRegexNumber = {};
          tempObjRegexNumber[`regexnum_${element.basicSearchKey}`] = {
            $regex: new RegExp(`${element.basicSearchValue}`, "i"),
          };
          stageMatchAnd.push(tempObjRegexNumber);
        }
      }

      if (stageMatchAnd.length > 0) {
        tempStage = {
          $match: {
            $and: stageMatchAnd,
          },
        };
        stageDocument.push(tempStage);
        stageCount.push(tempStage);
      }
    }

    const stageMatchOr = [];

    if (typeof searchQuery === "string" && searchQuery.trim().length >= 1) {
      const searchOrCondition = await this.commonSearchOrCondition({
        searchQuery,
      });

      searchOrCondition.additionalStages.forEach((tempStageNumber) => {
        stageDocument.push(tempStageNumber);
        stageCount.push(tempStageNumber);
      });

      searchOrCondition.matchOrArr.forEach((tempVal) => {
        stageMatchOr.push(tempVal);
      });
    }

    if (Array.isArray(searchDetails) && searchDetails.length > 0) {
      for (let index = 0; index < searchDetails.length; index++) {
        const element = searchDetails[index];

        if (
          element.basicSearchType === "number" &&
          typeof element.basicSearchValue === "number"
        ) {
          const tempObjNumber = {};
          tempObjNumber[element.basicSearchKey] = element.basicSearchValue;
          stageMatchOr.push(tempObjNumber);
        }

        if (
          element.basicSearchType === "string" &&
          typeof element.basicSearchValue === "string"
        ) {
          const tempObjString = {};
          tempObjString[element.basicSearchKey] = element.basicSearchValue;
          stageMatchOr.push(tempObjString);
        }

        if (
          element.basicSearchType === "regex-string" &&
          typeof element.basicSearchValue === "string"
        ) {
          const tempObjRegexString = {};
          tempObjRegexString[element.basicSearchKey] = new RegExp(
            element.basicSearchValue,
            "i",
          );
          stageMatchOr.push(tempObjRegexString);
        }

        if (
          element.basicSearchType === "regex-number" &&
          typeof element.basicSearchValue === "number"
        ) {
          const tempObjRegexNumber = {};
          tempObjRegexNumber[`regexnum_${element.basicSearchKey}`] = {
            $regex: new RegExp(`${element.basicSearchValue}`, "i"),
          };
          stageMatchOr.push(tempObjRegexNumber);
        }
      }
    }

    if (stageMatchOr.length > 0) {
      tempStage = {
        $match: {
          $or: stageMatchOr,
        },
      };
      stageDocument.push(tempStage);
      stageCount.push(tempStage);
    }

    tempStage = {
      $match: {
        isDeleted: false,
      },
    };
    stageDocument.push(tempStage);
    stageCount.push(tempStage);

    tempStage = {
      $sort: {},
    };
    tempStage.$sort[sortDetails?.sortKey || "createdAt"] =
      sortDetails?.sortType ?? -1;
    stageDocument.push(tempStage);
    stageCount.push(tempStage);

    if (
      page_enabled === "y" &&
      typeof limit === "number" &&
      typeof page === "number"
    ) {
      if (page > 0 && limit > 0) {
        const tempSkip = (page - 1) * limit;
        stageDocument.push({ $skip: tempSkip });
        stageDocument.push({ $limit: limit });
      }
    }

    stageCount.push({ $count: "count" });

    const resultDocument = await Book.aggregate(stageDocument);
    let totalCount = 0;

    if (page_enabled !== "y") {
      totalCount = resultDocument.length;
    } else {
      resultCount = await Book.aggregate(stageCount);
    }

    if (resultCount && Array.isArray(resultCount) && resultCount.length === 1) {
      if (typeof resultCount[0]?.count === "number") {
        totalCount = resultCount[0].count;
      }
    }

    const result = {
      books: resultDocument,
      totalBooks: totalCount,
      totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
      currentPage: page,
      limit,
    };

    await redis.set(cacheKey, JSON.stringify(result), { EX: 60 });

    return result;
  }

  async getBookById(bookId) {
    const redis = getRedis();
    const cacheKey = `book:single:${bookId}`;

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const book = await Book.findOne({ id: Number(bookId), isDeleted: false });

    if (!book) throw new AppError("Book not found", 404);

    await redis.set(cacheKey, JSON.stringify(book), { EX: 60 });

    return book;
  }

  async updateBook(bookId, data) {
    const { cover_image, pages, ...updateArgs } = data;

    const existingBook = await Book.findOne({ id: Number(bookId) });
    if (!existingBook) throw new AppError("Book not found", 404);

    let cover_image_url = existingBook.cover_image || {
      url: null,
      public_id: null,
    };

    if (
      typeof cover_image === "string" &&
      cover_image.startsWith("data:image")
    ) {
      if (existingBook.cover_image?.public_id) {
        await deleteImage(existingBook.cover_image.public_id);
      }

      const base64Data = cover_image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const optimizedBuffer = await sharp(buffer)
        .jpeg({ quality: 85 })
        .toBuffer();

      const processedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString(
        "base64",
      )}`;

      const uploaded = await uploadImage(processedBase64, "book-covers");

      cover_image_url = {
        url: uploaded.url,
        public_id: uploaded.public_id,
      };
    }

    const bookDataWithImage = {
      ...updateArgs,
      cover_image: cover_image_url,
    };

    const book = await Book.findOneAndUpdate(
      { id: Number(bookId) },
      bookDataWithImage,
      { returnDocument: "after", upsert: true },
    );

    if (Array.isArray(pages)) {
      const existingPages = await Page.find({ bookId: Number(bookId) }).sort({
        pageNumber: 1,
      });

      const existingPageMap = new Map(existingPages.map((p) => [p.id, p]));

      const incomingExistingPages = pages.filter((p) => p.id);
      const incomingNewPages = pages.filter((p) => !p.id);

      // Update existing pages
      for (let i = 0; i < incomingExistingPages.length; i++) {
        const page = incomingExistingPages[i];

        await Page.findOneAndUpdate(
          { id: Number(page.id), bookId: Number(bookId) },
          {
            title: page.title || `Page ${i + 1}`,
            content: page.content || "",
            pageNumber: i + 1,
          },
          { returnDocument: "after", upsert: true },
        );
      }

      // Create new pages
      if (incomingNewPages.length > 0) {
        const counter = await Counter.findOneAndUpdate(
          { name: "pageId" },
          { $inc: { value: incomingNewPages.length } },
          { returnDocument: "after", upsert: true },
        );

        const startId = counter.value - incomingNewPages.length + 1;
        const basePageNumber = incomingExistingPages.length;

        const pageDocs = incomingNewPages.map((p, idx) => ({
          id: startId + idx,
          bookId: Number(bookId),
          pageNumber: basePageNumber + idx + 1,
          content: p.content || "",
          title: p.title || `Page ${basePageNumber + idx + 1}`,
        }));

        await Page.insertMany(pageDocs);
      }

      // Normalize page numbers
      const allPages = await Page.find({ bookId: Number(bookId) }).sort({
        pageNumber: 1,
        id: 1,
      });

      for (let i = 0; i < allPages.length; i++) {
        if (allPages[i].pageNumber !== i + 1) {
          allPages[i].pageNumber = i + 1;
          await allPages[i].save();
        }
      }

      book.totalPages = allPages.length;
      await book.save();
    }

    const redis = getRedis();
    await redis.del(`book:single:${bookId}`);
    await this.#clearListCaches();

    return book;
  }

  async deleteBook(bookId) {
    await Page.deleteMany({ bookId: Number(bookId) });
    const book = await Book.findOne({ id: Number(bookId) });

    if (!book) throw new AppError("Book not found", 404);

    const publicId = book?.cover_image?.public_id;

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    book.isDeleted = true;
    book.deletedAt = new Date();
    await book.save();

    const redis = getRedis();
    await redis.del(`book:single:${bookId}`);
    await this.#clearListCaches();

    return true;
  }

  async addPage({ bookId, pageNumber, content }) {
    const book = await Book.findOne({ id: Number(bookId), isDeleted: false });

    if (!book) throw new AppError("Book not found", 404);

    const page = await Page.create({
      bookId: Number(bookId),
      pageNumber,
      content,
    });

    // update total pages
    book.totalPages = Math.max(book.totalPages, pageNumber);
    await book.save();

    const redis = getRedis();
    await this.#clearListCaches();

    return page;
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
  ✏️ UPDATE PAGE
  */
  async updatePage(bookId, pageNumber, data) {
    const page = await Page.findOneAndUpdate(
      {
        bookId: Number(bookId),
        pageNumber: Number(pageNumber),
      },
      data,
      { new: true },
    );

    if (!page) throw new AppError("Page not found", 404);

    const redis = getRedis();
    await this.#clearListCaches();

    return page;
  }

  /*
  ❌ DELETE PAGE
  */
  async deletePage(bookId, pageNumber) {
    const page = await Page.findOneAndDelete({
      bookId: Number(bookId),
      pageNumber: Number(pageNumber),
    });

    if (!page) throw new AppError("Page not found", 404);

    // update total pages (optional optimization)
    const maxPage = await Page.findOne({ bookId: Number(bookId) })
      .sort({ pageNumber: -1 })
      .select("pageNumber");

    await Book.updateOne(
      { id: Number(bookId) },
      { totalPages: maxPage?.pageNumber || 0 },
    );

    const redis = getRedis();
    await this.#clearListCaches();

    return true;
  }

  /*
  🔍 SEARCH BOOKS
  */
  async searchBooks({
    searchQuery,
    filters = {},
    sort = { createdAt: -1 },
    page = 1,
    limit = 10,
    minPrice,
    maxPrice,
  }) {
    const skip = (page - 1) * limit;

    const match = {
      isDeleted: false,
    };

    if (searchQuery) {
      match.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { author: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      match.price = {};
      if (minPrice !== undefined) match.price.$gte = minPrice;
      if (maxPrice !== undefined) match.price.$lte = maxPrice;
    }

    Object.assign(match, filters);

    const [books, total] = await Promise.all([
      Book.find(match).sort(sort).skip(skip).limit(limit).lean(),

      Book.countDocuments(match),
    ]);

    return {
      books,
      totalBooks: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    };
  }
}

export default new BookRepository();
