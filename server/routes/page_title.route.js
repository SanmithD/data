import express from "express";
import { createPageTitle, deletePageTitle, getPageTitleByParentId, updatePageTitle } from "../controllers/page_title.controller.js";

const pageTitleRouter = express.Router();

// CREATE
pageTitleRouter.post("/create", createPageTitle);

// GET by parentCardId
pageTitleRouter.get("/get/:id", getPageTitleByParentId);

// UPDATE
pageTitleRouter.put("/update/:id", updatePageTitle);

// DELETE
pageTitleRouter.delete("/delete/:id", deletePageTitle);

export default pageTitleRouter;