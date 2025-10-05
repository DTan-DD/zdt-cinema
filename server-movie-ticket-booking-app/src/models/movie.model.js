"use strict";
import { Schema, model } from "mongoose";

const DOCUMENT_NAME = "movie";
const COLLECTION_NAME = "movies";

const movieSchema = new Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    overview: { type: String, required: true },
    poster_path: { type: String, required: true },
    backdrop_path: { type: String, required: true },
    release_date: { type: String, required: true },
    original_language: { type: String },
    tagline: { type: String },
    genres: { type: Array, required: true },
    casts: { type: Array, required: true },
    vote_average: { type: Number, required: true },
    runtime: { type: Number, required: true },
    trailer: { type: String, default: "" },
    status: {
      type: String,
      enum: ["upcoming", "now_showing", "ended"],
      default: "upcoming",
    },
    isFeatured: { type: Boolean, default: false }, // để highlight phim hot
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

const Movie = model(DOCUMENT_NAME, movieSchema);
export default Movie;
