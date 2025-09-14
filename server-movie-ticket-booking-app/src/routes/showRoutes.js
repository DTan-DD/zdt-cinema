import express from "express";
import { addShow, getNowPlayingMovies, getShow, getShowById, getShows } from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

showRouter.get("/all", getShows);
showRouter.get("/now-playing", protectAdmin, getNowPlayingMovies);
showRouter.get("/:movieId", getShow);
showRouter.get("/get-show/:showId", getShowById);
// showRouter.use(protectAdmin);
showRouter.post("/add", protectAdmin, addShow);

export default showRouter;
