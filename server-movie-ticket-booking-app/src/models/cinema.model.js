"use strict";
import { Schema, model } from "mongoose";

const DOCUMENT_NAME = "cinema";
const COLLECTION_NAME = "cinemas";

const cinemaSchema = new Schema(
  {
    name: { type: String, required: true },
    location: { type: String },
    phone: { type: String },
    image: { type: String },
    description: { type: String },
    totalSeats: { type: Number, default: 50 },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

const Cinema = model(DOCUMENT_NAME, cinemaSchema);
export default Cinema;
