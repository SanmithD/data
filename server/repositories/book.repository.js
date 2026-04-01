import { getRedis } from "../config/redis.js";
import { Book } from "../models/book.js";
import { Page } from "../models/book_page.model.js";
import { Counter } from "../models/counter.js";
import { AppError } from "../utils/AppError.js";
import sharp from "sharp";
import { uploadImage } from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";

class BookRepository {
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

  async getBooks(page, limit) {
    const redis = getRedis();
    const cacheKey = `books:all:${page}:${limit}`;

    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      Book.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Book.countDocuments({ isDeleted: false }),
    ]);

    const result = {
      books,
      totalBooks: total,
      totalPages: Math.ceil(total / limit),
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
    const { cover_image, ...updateArgs } = data;

    // 👉 Get existing book first
    const existingBook = await Book.findOne({ id: Number(bookId) });

    if (!existingBook) throw new AppError("Book not found", 404);

    let cover_image_url = existingBook.cover_image || {
      url: null,
      public_id: null,
    };

    // ✅ If new base64 image is provided
    if (
      typeof cover_image === "string" &&
      cover_image.startsWith("data:image")
    ) {
      // 👉 Delete old image if exists
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
      { new: true },
    );

    const redis = getRedis();
    await redis.del(`book:single:${bookId}`);
    await this.#clearListCaches();

    return book;
  }

  async deleteBook(bookId) {
    const book = await Book.findOne({ id: Number(bookId) });

    if (!book) throw new AppError("Book not found", 404);

    if (book.cover_image?.public_id !== null || book.cover_image?.public_id !== undefined || book.cover_image?.public_id !== "") {
      await cloudinary.uploader.destroy(book.cover_image.public_id);
    }

    book.isDeleted = true;
    book.deletedAt = new Date();
    await book.save();

    const redis = getRedis();
    await redis.del(`book:single:${bookId}`);
    await this.#clearListCaches();

    return true;
  }

  /*
  📄 ADD PAGE
  */
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

  /*
  📄 GET PAGES
  */
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
