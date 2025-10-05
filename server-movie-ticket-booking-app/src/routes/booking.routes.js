"use strict";
import express from "express";
import bookingController from "../controllers/booking.controller.js";
import { idempotencyMiddleware } from "../middleware/idempotency.middleware.js";
import asyncHandler from "../middleware/asyncHandler.js";

const bookingRouter = express.Router();

bookingRouter.post("/create", idempotencyMiddleware, asyncHandler(bookingController.createBooking));
bookingRouter.post("/payment", asyncHandler(bookingController.bookingPayment));
bookingRouter.post("/cancel/:bookingId", asyncHandler(bookingController.cancelBooking));
bookingRouter.get("/seats/:showId", asyncHandler(bookingController.getOccupiedSeats));

export default bookingRouter;
