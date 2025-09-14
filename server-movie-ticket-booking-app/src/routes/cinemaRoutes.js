import express from "express";
import { getAllCinemas } from "../controllers/cinemaController.js";

const cinemaRouter = express.Router();

cinemaRouter.get("/all", getAllCinemas);

export default cinemaRouter;
