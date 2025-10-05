"use strict";

import { successResponse } from "../core/success.response.js";
import { bookingPayment, cancelBooking, createBookingV2, getOccupiedSeats } from "../services/booking.service.js";

class BookingController {
  createBooking = async (req, res, next) => {
    new successResponse({
      message: "Booking created successfully ",
      metadata: await createBookingV2(req),
    }).send(res);
  };

  bookingPayment = async (req, res, next) => {
    new successResponse({
      message: "Payment booking successfully ",
      metadata: await bookingPayment(req),
    }).send(res);
  };

  cancelBooking = async (req, res, next) => {
    new successResponse({
      message: "Cancel booking successfully ",
      metadata: await cancelBooking(req),
    }).send(res);
  };

  getOccupiedSeats = async (req, res, next) => {
    new successResponse({
      message: "Get occupied seats successfully ",
      metadata: await getOccupiedSeats(req),
    }).send(res);
  };
}

export default new BookingController();
