"use strict";
import { Schema, model } from "mongoose";

const DOCUMENT_NAME = "show";
const COLLECTION_NAME = "shows";

const showSchema = new Schema(
  {
    movie: { type: String, required: true, ref: "movie" },
    cinema: { type: String, required: true, ref: "cinema" },
    showDateTime: { type: Date, required: true },
    showPrice: { type: Number, required: true },
    occupiedSeats: { type: Object, default: {} },
    runtime: { type: Number, default: 120 },
    isDraft: {
      type: Boolean,
      default: true,
      index: true,
      select: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
      select: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    minimize: false,
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

const Show = model(DOCUMENT_NAME, showSchema);
export default Show;
