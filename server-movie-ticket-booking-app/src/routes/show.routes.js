"use strict";
import express from "express";
import { protectAdmin } from "../middleware/auth.middeware.js";
import asyncHandler from "../middleware/asyncHandler.js";
import showController from "../controllers/show.controller.js";

const showRouter = express.Router();

showRouter.get("/all", asyncHandler(showController.getShows));
showRouter.get("/now-playing", asyncHandler(showController.getNowPlayingMoviesFromApi));
showRouter.get("/upcoming", asyncHandler(showController.getUpcomingShows));
showRouter.get("/movies", asyncHandler(showController.getAvailableMovies));
showRouter.get("/:movieId", asyncHandler(showController.getShow));
showRouter.get("/get-show/:showId", asyncHandler(showController.getShowById));
showRouter.get("/cinema/:cinemaId", asyncHandler(showController.getShowByCinema));
// showRouter.use(protectAdmin);
showRouter.post("/add", protectAdmin, asyncHandler(showController.addShow));

export default showRouter;
