"use strict";
import Cinema from "../models/cinema.model.js";
import { isValidObjectId } from "mongoose";
import { BadRequestError } from "../core/error.response.js";

export const getAllCinemas = async (req) => {
  const { filter = "all", sort = "newest", page = 1, limit = 10, search = "" } = req.query;

  let query = {};

  // --- Search theo name, location, phone ---
  if (search) {
    query.$or = [{ name: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }, { phone: { $regex: search, $options: "i" } }];
  }

  // --- Filter nâng cao (tùy bạn định nghĩa) ---
  if (filter !== "all") {
    switch (filter) {
      case "hasImage":
        query.image = { $exists: true, $ne: "" };
        break;
      case "hasPhone":
        query.phone = { $exists: true, $ne: "" };
        break;
      case "large":
        query.totalSeats = { $gte: 100 }; // cinema lớn
        break;
      case "small":
        query.totalSeats = { $lt: 100 }; // cinema nhỏ
        break;
    }
  }

  // --- Sort ---
  let sortOption = { createdAt: -1 };
  if (sort === "oldest") sortOption = { createdAt: 1 };
  if (sort === "seats-asc") sortOption = { totalSeats: 1 };
  if (sort === "seats-desc") sortOption = { totalSeats: -1 };

  // --- Pagination ---
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // --- Query với lean để tối ưu ---
  const [cinemas, total] = await Promise.all([Cinema.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)).lean(), Cinema.countDocuments(query)]);

  return {
    cinemas,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

export const updateCinema = async (req, res) => {
  const { id } = req.params;
  const { name, location, phone, image, description, totalSeats } = req.body;

  // --- Validate id ---
  if (!isValidObjectId(id)) {
    return BadRequestError("Invalid cinema id");
  }

  // --- Validate name ---
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return BadRequestError("Invalid cinema name");
  }

  // --- Validate phone (optional: regex VN/US number) ---
  // if (phone && !/^[0-9+\-() ]{6,20}$/.test(phone)) {
  //   return res.status(400).json({ message: "Invalid phone number format" });
  // }

  // --- Validate totalSeats ---
  if (totalSeats !== undefined) {
    if (typeof totalSeats !== "number" || totalSeats <= 0) {
      return BadRequestError("Invalid totalSeats");
    }
  }

  // --- Find & Update ---
  const updatedCinema = await Cinema.findByIdAndUpdate(
    id,
    { name, location, phone, image, description, totalSeats },
    { new: true, runValidators: true } // new: trả về bản ghi đã update
  ).lean();

  if (!updatedCinema) {
    return BadRequestError("Cinema not found");
  }

  return { cinema: updatedCinema };
};
