import express from "express";
import {
  createBook,
  deleteBook,
  getBookById,
  getBooks,
  updateBook,
  searchBooks,
  addPage,
  getPages,
  updatePage,
  deletePage
} from "../controllers/book.controller.js";
import { getLastPage, getPageByNumber, getPageCount } from "../controllers/page.controller.js";

const bookRouter = express.Router();

/*
📘 BOOK ROUTES
*/

// Create book
bookRouter.post("/book", createBook);

// Get all books (pagination)
bookRouter.get("/books", getBooks);

// Get single book (by bookId)
bookRouter.get("/book/:bookId", getBookById);

// Search books
bookRouter.post("/books/search", searchBooks);

// Update book
bookRouter.put("/book/:bookId", updateBook);

// Delete book (soft delete)
bookRouter.delete("/book/:bookId", deleteBook);


/*
📄 PAGE ROUTES (SCALABLE DESIGN)
*/

// Add page to book
bookRouter.post("/book/:bookId/page", addPage);

// Get pages of a book (paginated)
bookRouter.get("/book/:bookId/pages", getPages);

// Update a specific page
bookRouter.put("/book/:bookId/page/:pageNumber", updatePage);

// Delete a page
bookRouter.delete("/book/:bookId/page/:pageNumber", deletePage);

// 📖 Get single page (reader use)
bookRouter.get("/book/:bookId/pages/:pageNumber", getPageByNumber);

// ⏭️ Get last page (resume reading)
bookRouter.get("/book/:bookId/pages-last", getLastPage);

// 🔢 Get total page count
bookRouter.get("/book/:bookId/pages-count", getPageCount);


export default bookRouter;