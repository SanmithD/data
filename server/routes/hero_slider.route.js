import express from "express";
import {
  createSlider,
  getSlider,
  updateSlider,
  deleteSlider,
} from "../controllers/hero_slider.controller.js";

const heroSliderRoutes = express.Router();

heroSliderRoutes.post("/create", createSlider);

heroSliderRoutes.get("/get", getSlider);

heroSliderRoutes.put("/update/:id", updateSlider);

heroSliderRoutes.delete("/delete/:id", deleteSlider);

export default heroSliderRoutes;