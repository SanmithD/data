import bookRepository from "../repositories/book.repository.js";


export const createBook = async (req, res) => {
  try {
    const book = await bookRepository.createBook(req.body);

    res.status(201).json(book);
  } catch (error) {
    console.error("Create book error:", error);
    res.status(500).json({ error: error.message });
  }
};

/*
GET ALL BOOKS (PAGINATED)
*/
export const getBooks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);

    const data = await bookRepository.getBooks(page, limit);

    res.json(data);
  } catch (error) {
    console.error("Get books error:", error);
    res.status(500).json({ error: error.message });
  }
};

/*
GET BOOK BY bookId (NOT _id)
*/
export const getBookById = async (req, res) => {
  try {
    const book = await bookRepository.getBookById(req.params.bookId);

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("Get book error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/*
UPDATE BOOK
*/
export const updateBook = async (req, res) => {
  try {
    const book = await bookRepository.updateBook(req.params.bookId, req.body);

    res.json(book);
  } catch (error) {
    console.error("Update book error:", error);
    res.status(500).json({ error: error.message });
  }
};

/*
DELETE BOOK (SOFT DELETE RECOMMENDED)
*/
export const deleteBook = async (req, res) => {
  try {
    await bookRepository.deleteBook(req.params.bookId);

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Delete book error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/*
ADD PAGE TO BOOK
*/
export const addPage = async (req, res) => {
  try {
    const { content, pageNumber } = req.body;

    const page = await bookRepository.addPage({
      bookId: req.params.bookId,
      content,
      pageNumber,
    });

    res.status(201).json(page);
  } catch (error) {
    console.error("Add page error:", error);
    res.status(500).json({ error: error.message });
  }
};

/*
GET PAGES OF A BOOK (PAGINATED)
*/
export const getPages = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);

    const data = await bookRepository.getPages(req.params.bookId, page, limit);

    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Get pages error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/*
UPDATE PAGE
*/
export const updatePage = async (req, res) => {
  try {
    const page = await bookRepository.updatePage(
      req.params.bookId,
      req.params.pageNumber,
      req.body,
    );

    res.json(page);
  } catch (error) {
    console.error("Update page error:", error);
    res.status(500).json({ error: error.message });
  }
};

/*
DELETE PAGE
*/
export const deletePage = async (req, res) => {
  try {
    await bookRepository.deletePage(req.params.bookId, req.params.pageNumber);

    res.status(200).json({
      success: true,
      message: "Page deleted successfully",
    });
  } catch (error) {
    console.error("Delete page error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/*
SEARCH BOOKS
*/
export const searchBooks = async (req, res) => {
  try {
    const {
      searchQuery,
      filters,
      sort,
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
    } = req.body;

    const result = await bookRepository.searchBooks({
      searchQuery,
      filters,
      sort,
      page,
      limit,
      minPrice,
      maxPrice,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Search books error:", error);
    res.status(500).json({ error: error.message });
  }
};
