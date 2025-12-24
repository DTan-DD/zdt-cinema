"use strict";
import { Schema, model } from "mongoose";
import slugify from "slugify";

const DOCUMENT_NAME = "movie";
const COLLECTION_NAME = "movies";

const movieSchema = new Schema(
  {
    _id: { type: String, required: true, index: true },
    title: { type: String, required: true, index: true },
    slug: {
      type: String,
      required: true,
    },
    overview: { type: String, required: true, default: "Đang cập nhật" },
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
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

movieSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

/**
 * movieSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});
 */

movieSchema.pre("validate", async function (next) {
  if (this.slug || this.isDeleted) return next();

  const baseSlug = slugify(this.title, {
    lower: true,
    strict: true,
    locale: "vi",
    trim: true,
  });

  let slug = baseSlug;
  let count = 1;

  const Movie = this.constructor;

  while (await Movie.exists({ slug })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  this.slug = slug;
  next();
});

const Movie = model(DOCUMENT_NAME, movieSchema);
export default Movie;
