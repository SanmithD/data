import pageTitleRepository from "../repositories/pageTitleRepository.js";

// CREATE
export const createPageTitle = async (req, res) => {
  try {
    const { parentCardId, title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const pageTitle = await pageTitleRepository.createPageTitle({
      title,
      parentCardId: parentCardId || null,
    });

    res.status(201).json({
      success: true,
      data: pageTitle,
    });
  } catch (error) {
    console.error("Create pageTitle error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to create page title",
    });
  }
};

// GET BY PARENT ID
export const getPageTitleByParentId = async (req, res) => {
  try {
    const { id } = req.params;

    const pageTitles = await pageTitleRepository.getPageTitlesByParentId(id);

    res.status(200).json({
      success: true,
      count: pageTitles.length,
      data: pageTitles,
    });
  } catch (error) {
    console.error("Get pageTitle error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch page titles",
    });
  }
};

// UPDATE
export const updatePageTitle = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedPageTitle = await pageTitleRepository.updatePageTitle(id, req.body);

    res.status(200).json({
      success: true,
      data: updatedPageTitle,
    });
  } catch (error) {
    console.error("Update pageTitle error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update page title",
    });
  }
};

// DELETE
export const deletePageTitle = async (req, res) => {
  try {
    const { id } = req.params;

    await pageTitleRepository.deletePageTitle(id);

    res.status(200).json({
      success: true,
      message: "Page title deleted successfully",
    });
  } catch (error) {
    console.error("Delete pageTitle error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete page title",
    });
  }
};
