import pageRepository from "../repositories/page.repository.js";

export const getPages = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);

    const data = await pageRepository.getPages(req.params.bookId, page, limit);

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

export const getPageByNumber = async (req, res) => {
  try {
    const { bookId, pageNumber } = req.params;

    const page = await pageRepository.getPageByNumber(bookId, pageNumber);

    res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error("Get page error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getLastPage = async (req, res) => {
  try {
    const page = await pageRepository.getLastPage(req.params.bookId);

    res.status(200).json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error("Get last page error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getPageCount = async (req, res) => {
  try {
    const count = await pageRepository.getPageCount(req.params.bookId);

    res.status(200).json({
      success: true,
      totalPages: count,
    });
  } catch (error) {
    console.error("Get page count error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
