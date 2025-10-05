"use strict";
import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import cinemaController from "../controllers/cinema.controller.js";
import { protectAdmin } from "../middleware/auth.middeware.js";
import { requireAuth } from "@clerk/express";

const cinemaRouter = express.Router();

// cinemaRouter.use(requireAuth());
// cinemaRouter.use(protectAdmin);
cinemaRouter.get("/all", asyncHandler(cinemaController.getAllCinemas));
cinemaRouter.put("/update-cinema/:id", requireAuth(), protectAdmin, asyncHandler(cinemaController.updateCinema));

export default cinemaRouter;
