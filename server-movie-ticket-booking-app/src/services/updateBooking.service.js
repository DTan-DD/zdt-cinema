"use strict";

import { inngest } from "../inngest/index.js";
import Booking from "../models/booking.model.js";
import PaymentLog from "../models/paymentLog.model.js";

export const updateBooking = async ({ bookingLogId }) => {
  const logId = bookingLogId;
  const log = await PaymentLog.findById(logId);
  if (!log) throw new Error("PaymentLog not found");

  // tránh xử lý trùng
  if (log.steps.updateBooking.status === "SUCCESS") return;

  try {
    const booking = await Booking.findById(log.bookingId);
    if (!booking) throw new Error("Booking not found");

    booking.isPaid = true;
    booking.paymentLink = log.provider;
    booking.paymentDate = new Date();
    await booking.save();

    log.steps.updateBooking.status = "SUCCESS";

    // Send Confirmation Email
    await inngest.send({ name: "app/show.booked", data: { bookingId: booking._id } });
    log.steps.sendMail.status = "SUCCESS";
    log.status = "SUCCESS";
    await log.save();

    console.log(`✅ Booking ${booking._id} reconciled as PAID via ${log.provider}`);
  } catch (error) {
    console.error(error);
    log.steps.updateBooking.status = "FAILED";
    log.steps.updateBooking.error = error.message;
    await log.save();
    throw error;
  }
};
