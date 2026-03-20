import express from "express";
import {
  createSlider,
  getSlider,
  updateSlider,
  deleteSlider,
} from "../controllers/heroSliderController.js";

const heroSliderRoutes = express.Router();

/**
 * CREATE (upload images)
 */
heroSliderRoutes.post("/create", createSlider);

/**
 * GET (latest slider)
 */
heroSliderRoutes.get("/get", getSlider);

/**
 * UPDATE (replace images)
 */
heroSliderRoutes.put("/update/:id", updateSlider);

/**
 * DELETE
 */
heroSliderRoutes.delete("/delete/:id", deleteSlider);

export default heroSliderRoutes;