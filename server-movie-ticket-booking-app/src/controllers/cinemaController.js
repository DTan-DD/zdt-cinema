"use strict";

import Cinema from "../models/Cinema.js";

export const getAllCinemas = async (req, res) => {
  try {
    const cinemas = await Cinema.find({}).lean();
    res.status(200).json({ success: true, cinemas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
