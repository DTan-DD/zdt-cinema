"use strict";
import express from "express";
import { protectAdmin } from "../middleware/auth.middeware.js";
import movieController from "../controllers/movie.controller.js";
import asyncHandler from "../middleware/asyncHandler.js";
import adminController from "../controllers/admin.controller.js";
import { requireAuth } from "@clerk/express";

const adminRouter = express.Router();

adminRouter.use(requireAuth());
adminRouter.use(protectAdmin);
adminRouter.get("/is-admin", adminController.isAdmin);
adminRouter.get("/dashboard", asyncHandler(adminController.getDashboardData));
adminRouter.get("/all-shows", asyncHandler(adminController.getAllShows));
adminRouter.get("/all-bookings", asyncHandler(adminController.getAllBookings));
adminRouter.get("/all-movies", asyncHandler(movieController.getAllMovies));
adminRouter.put("/update-show/:showId", asyncHandler(adminController.updateShow));
adminRouter.put("/update-booking/:bookingId", asyncHandler(adminController.updateBooking));
adminRouter.put("/update-movie/:movieId", asyncHandler(adminController.updateMovie));
adminRouter.put("/delete-show/:showId", asyncHandler(adminController.deleteShow));
adminRouter.put("/delete-booking/:bookingId", asyncHandler(adminController.deleteBooking));
adminRouter.put("/delete-movie/:movieId", asyncHandler(adminController.deleteMovie));

export default adminRouter;
