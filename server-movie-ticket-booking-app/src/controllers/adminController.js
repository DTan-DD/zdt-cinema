"use strict";

import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";

// API to check if user is admin
export const isAdmin = async (req, res) => {
  res.json({ success: true, isAdmin: true });
};

// API to get dashboard data
export const getDashboardData = async (req, res) => {
  try {
    const bookings = await Booking.find({ isPaid: true });
    const shows = await Show.find({ showDateTime: { $gte: new Date() } }).populate("movie");

    const totalUser = await User.countDocuments();

    const dashboardData = {
      totalUser,
      totalBookings: bookings.length,
      activeShows: shows,
      totalRevenue: bookings.reduce((total, booking) => total + booking.amount, 0),
    };
    res.status(200).json({ success: true, dashboardData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// API to get all shows from dbs
export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 });

    //   filter unique shows
    // const uniqueShows = new Set(shows.map((show) => show.movie));

    res.status(200).json({ success: true, shows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// API to get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user")
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
