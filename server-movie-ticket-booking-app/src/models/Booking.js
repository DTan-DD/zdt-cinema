"use strict";
import { Schema, model } from "mongoose";

const DOCUMENT_NAME = "booking";
const COLLECTION_NAME = "bookings";

const bookingSchema = new Schema(
  {
    user: { type: String, required: true, ref: "user" },
    show: { type: String, required: true, ref: "show" },
    amount: { type: Number, required: true },
    bookedSeats: { type: Array, required: true },
    isPaid: { type: Boolean, default: false },
    paymentLink: { type: String },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

const Booking = model(DOCUMENT_NAME, bookingSchema);
export default Booking;
