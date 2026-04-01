import express from "express";
import {
  createDetail,
  getDetail,
  updateDetail,
  deleteDetail,
} from "../controllers/timeline_detail.controller.js";

const timelineDetailRoutes = express.Router();

timelineDetailRoutes.post("/", createDetail);

timelineDetailRoutes.get("/:timelineId", getDetail);

timelineDetailRoutes.put("/:timelineId", updateDetail);

timelineDetailRoutes.delete("/:timelineId", deleteDetail);

export default timelineDetailRoutes;