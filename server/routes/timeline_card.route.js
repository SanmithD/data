// routes/cardRoutes.js
import express from "express";
import { createTimelineCard, deleteTimelineCard, getTimelineCardById, getTimelineCards, reorderTimeCards, updateTimelineCard } from "../controllers/timeline_card.controller.js";

const timeRouter = express.Router();

timeRouter.post("/insertTimeline", createTimelineCard);

timeRouter.get("/getTimeline", getTimelineCards);

timeRouter.get("/getTimeline/:id", getTimelineCardById);

timeRouter.put("/updateTimeline/:id", updateTimelineCard);

timeRouter.delete("/deleteTimeline/:id", deleteTimelineCard);

timeRouter.put("/timeline-reorder", reorderTimeCards);


export default timeRouter;