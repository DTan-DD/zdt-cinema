"use strict";
import express from "express";
import asyncHandler from "../middleware/asyncHandler.js";
import userController from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.get("/bookings", asyncHandler(userController.getUserBookings));
userRouter.post("/update-favorite", asyncHandler(userController.updateFavoriteMovie));
userRouter.get("/favorites", asyncHandler(userController.getFavoriteMovies));

export default userRouter;
