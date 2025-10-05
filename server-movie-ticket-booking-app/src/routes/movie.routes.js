"use strict";
import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import movieController from "../controllers/movie.controller.js";

const movieRouter = express.Router();

movieRouter.get("/search", asyncHandler(movieController.getAllMovies));
movieRouter.post("/add-movie", asyncHandler(movieController.addMovie));

export default movieRouter;
