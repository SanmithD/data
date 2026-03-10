// routes/cardRoutes.js
import express from "express";
import { createCard, deleteCard, getCardById, getCards, getChildCards, updateCard } from "../controllers/cardController.js";

const router = express.Router();

router.post("/card", createCard);

router.get("/cards", getCards);

router.get("/card/:id", getCardById);

router.get("/card/:id/children", getChildCards);

router.put("/card/:id", updateCard);

router.delete("/card/:id", deleteCard);

export default router;