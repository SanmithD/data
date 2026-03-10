import cardRepository from "../repositories/cardRepository.js";

export const createCard = async (req, res) => {
  try {

    const { parentId, ...cardData } = req.body;

    const card = await cardRepository.createCard({
      ...cardData,
      parentCard: parentId || null
    });

    if (parentId) {
      await cardRepository.addSubCard(parentId, card._id);
    }

    res.status(201).json(card);

  } catch (error) {
    console.error("Create card error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getCards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const cards = await cardRepository.getCards(page, limit);

    res.json(cards);

  } catch (error) {
    console.error("Get cards error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getCardById = async (req, res) => {
  try {
    const card = await cardRepository.getCardById(req.params.id);

    res.json(card);

  } catch (error) {
    console.error("Get card error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getChildCards = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const data = await cardRepository.getChildCards(
      req.params.id,
      page,
      limit
    );

    res.json(data);

  } catch (error) {
    console.error("Get child cards error:", error);
    res.status(500).json({ error: error.message });
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

    res.json({ message: "Card deleted" });

  } catch (error) {
    console.error("Delete card error:", error);
    res.status(500).json({ error: error.message });
  }
};