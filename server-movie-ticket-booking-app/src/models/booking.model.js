"use strict";
import { Schema, model } from "mongoose";
import { nanoidBooking } from "../utils/index.js";

const DOCUMENT_NAME = "booking";
const COLLECTION_NAME = "bookings";

const bookingSchema = new Schema(
  {
    bookingCode: {
      type: String,
      unique: true,
      default: () => `BK-${nanoidBooking()}`, // ví dụ: BK-8F4D9A1C
    },
    user: { type: String, required: true, ref: "user" },
    show: { type: String, required: true, ref: "show" },
    paymentMethod: { type: String, required: true },
    amount: { type: Number, required: true },
    bookedSeats: { type: Array, required: true },
    tickets: [{ type: Schema.Types.ObjectId, ref: "Ticket" }], // liên kết tới tickets
    isPaid: { type: Boolean, default: false },
    paymentLink: { type: String },
    paymentDate: { type: Date },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

const Booking = model(DOCUMENT_NAME, bookingSchema);
export default Booking;
