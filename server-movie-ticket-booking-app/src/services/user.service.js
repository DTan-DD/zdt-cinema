"use strict";

import { clerkClient } from "@clerk/express";
import Booking from "../models/booking.model.js";
import Movie from "../models/movie.model.js";

// API Controller func to Get user Bookings
export const getUserBookings = async (req, res) => {
  const user = req.auth().userId;
  const bookings = await Booking.find({ user, isDeleted: false })
    .populate({
      path: "show",
      populate: { path: "movie cinema" },
    })
    .sort({ createdAt: -1 });

  return { bookings };
};

// API Controller func to Add favorite movie in Clerk User Metadata
export const updateFavoriteMovie = async (req, res) => {
  const { movieId } = req.body;
  const userId = req.auth().userId;
  const user = await clerkClient.users.getUser(userId);

  if (!user.privateMetadata.favorites) {
    user.privateMetadata.favorites = [];
  }

  if (!user.privateMetadata.favorites.includes(movieId)) {
    user.privateMetadata.favorites.push(movieId);
  } else {
    user.privateMetadata.favorites = user.privateMetadata.favorites.filter((id) => id !== movieId);
  }

  await clerkClient.users.updateUserMetadata(userId, { privateMetadata: user.privateMetadata });
  return;
};

export const getFavoriteMovies = async (req, res) => {
  const user = await clerkClient.users.getUser(req.auth().userId);
  const favoriteMovies = user.privateMetadata.favorites;

  // Getting movies from dbs
  const movies = await Movie.find({ _id: { $in: favoriteMovies } });

  return { movies };
};
