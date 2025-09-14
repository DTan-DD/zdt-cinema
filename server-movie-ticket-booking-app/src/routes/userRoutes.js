"use strict";
import express from "express";
import { getFavoriteMovies, getUserBookings, updateFavoriteMovie } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/bookings", getUserBookings);
userRouter.post("/update-favorite", updateFavoriteMovie);
userRouter.get("/favorites", getFavoriteMovies);

export default userRouter;
