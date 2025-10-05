"use strict";
import { Schema, model } from "mongoose";
import { nanoidTicket } from "../utils/index.js";

const DOCUMENT_NAME = "ticket";
const COLLECTION_NAME = "tickets";

const ticketSchema = new Schema(
  {
    ticketCode: {
      type: String,
      unique: true,
      default: () => `TKT-${nanoidTicket()}`, // ví dụ: TKT-HS92JKQ1P0
    },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    seat: { type: String, required: true },
    status: {
      type: String,
      enum: ["valid", "cancelled", "used"],
      default: "valid",
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

const Ticket = model(DOCUMENT_NAME, ticketSchema);
export default Ticket;
