"use strict";

import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

// API Controller func to Get user Bookings
export const getUserBookings = async (req, res) => {
  try {
    const user = req.auth().userId;

    const bookings = await Booking.find({ user })
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// API Controller func to Add favorite movie in Clerk User Metadata
export const updateFavoriteMovie = async (req, res) => {
  try {
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

    res.status(200).json({ success: true, message: "Favorite movie updated" });
  } catch (error) {}
};

export const getFavoriteMovies = async (req, res) => {
  try {
    const user = await clerkClient.users.getUser(req.auth().userId);
    const favoriteMovies = user.privateMetadata.favorites;

    // Getting movies from dbs
    const movies = await Movie.find({ _id: { $in: favoriteMovies } });

    res.status(200).json({ success: true, movies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
