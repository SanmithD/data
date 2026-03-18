// routes/cardRoutes.js
import express from "express";
import { createCard, deleteCard, getCardById, getCards, getCardsByTimeline, getChildCards, reorderCards, updateCard } from "../controllers/cardController.js";

const router = express.Router();

router.post("/card", createCard);

router.get("/cards", getCards);
router.get("/cardsByTimeline/:timeId", getCardsByTimeline);
router.get("/card/:id", getCardById);

router.get("/card/:id/children", getChildCards);

router.put("/card/:id", updateCard);

router.delete("/card/:id", deleteCard);
router.put("/reorder", reorderCards);

export default router;