import cardRepository from "../repositories/cardRepository.js";

export const createCard = async (req, res) => {
  try {
    const { parentId, ...cardData } = req.body;

    const card = await cardRepository.createCard({
      ...cardData,
      parentCard: parentId || null,
    });

    if (parentId) {
      // Use card._id (MongoDB ObjectId), NOT card.id (custom number)
      await cardRepository.addSubCard(parentId, card._id);
    }

    res.status(201).json(card);

  } catch (error) {
    console.error("Create card error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ OPTIMIZED: getCards controller
export const getCards = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);

    const paginatedData = await cardRepository.getCards(page, limit);

    res.json(paginatedData);
  } catch (error) {
    console.error("Get cards error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getChildCards = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);

    const data = await cardRepository.getChildCards(
      req.params.id,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      ...data,
    });

  } catch (error) {
    console.error("Get child cards error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getCardById = async (req, res) => {
  try {
    const card = await cardRepository.getCardById(req.params.id);

    res.status(200).json({
      success: true,
      data: card,
    });

  } catch (error) {
    console.error("Get card error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateCard = async (req, res) => {
  try {
    const card = await cardRepository.updateCard(
      req.params.id,
      req.body
    );

    res.json(card);

  } catch (error) {
    console.error("Update card error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteCard = async (req, res) => {
  try {
    await cardRepository.deleteCard(req.params.id);

    res.status(200).json({
      success: true,
      message: "Card deleted successfully",
    });

  } catch (error) {
    console.error("Delete card error:", error);

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Update card positions after drag-and-drop
export const reorderCards = async (req, res) => {
  try {
    const { updatedOrder } = req.body;
    // updatedOrder = [{ id: "mongoId1", position: 1 }, { id: "mongoId2", position: 2 }, ...]

    if (!Array.isArray(updatedOrder)) {
      return res.status(400).json({ error: "Invalid order format" });
    }

    // Use repository function to bulk update positions
    await cardRepository.updateCardPositions(updatedOrder);

    res.json({ success: true });
  } catch (error) {
    console.error("Reorder cards error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getCardsByTimeline = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const timeId = req.params

    const paginatedData = await cardRepository.getCardsByTimelineId(page, limit, timeId);

    res.json(paginatedData);
  } catch (error) {
    console.error("Get cards error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const searchCards = async (req, res) => {
  try {
    const {
      searchDetails,
      searchDetailsAnd,
      sortDetails,
      searchQuery,
      page = 1,
      limit = 10,
      fromTime,
      toTime
    } = req.body;

    const result = await cardRepository.searchCards({
      searchDetails,
      searchDetailsAnd,
      sortDetails,
      searchQuery,
      page,
      limit,
      fromTime,
      toTime
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Search cards error:", error);
    res.status(500).json({ error: error.message });
  }
};