"use strict";
import axios from "axios";
import Movie from "../models/movie.model.js";
import Show from "../models/show.model.js";
import { inngest } from "../inngest/index.js";
import { BadRequestError } from "../core/error.response.js";
import { escapeRegex } from "../utils/index.js";

export const getAllMovies = async (req) => {
  const { filter = "all", sort = "newest", page = 1, limit = 10, search = "" } = req.query;
  const now = new Date();
  let query = {};

  if (search?.length > 100) throw new Error("Search query too long");

  // --- Xử lý search tốt hơn ---
  if (search) {
    const safeSearch = escapeRegex(search.trim());
    query.$or = [{ title: { $regex: safeSearch, $options: "i" } }];
  }

  // --- Filter theo trạng thái ---
  if (filter !== "all") {
    switch (filter) {
      case "upcoming":
        query.status = "upcoming";
        break;
      case "now_showing":
        query.status = "now_showing";
        break;
      case "ended":
        query.status = "ended";
        break;
      case "featured":
        query.isFeatured = true;
        break;
    }
  }
  query.isDeleted = false;

  // --- Sort ---
  let sortOption = { release_date: -1 };
  if (sort === "oldest") sortOption = { release_date: 1 };
  if (sort === "showTime-asc") sortOption = { "show.startTime": 1 };
  if (sort === "showTime-desc") sortOption = { "show.startTime": -1 };

  // --- Pagination ---
  // Filter, Sort, Pagination — như cũ nhưng ép kiểu an toàn hơn
  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.min(parseInt(limit) || 10, 100);
  const skip = (pageNum - 1) * limitNum;

  // --- Query với populate ---
  const [movies, total] = await Promise.all([
    Movie.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)).lean(), // thêm lean() để tối ưu performance
    Movie.countDocuments(query),
  ]);

  return {
    movies, //
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
};

export const addMovie = async (req, res) => {
  const { movieId } = req.body;
  let movie = await Movie.findOne({ _id: movieId });

  if (movie) {
    throw new BadRequestError("Movie already exists");
  }
  // Fetch movie details, credits, and videos from TMDB API
  const [movieDetailsResponse, movieCreditsResponse, movieVideosResponse] = await Promise.all([
    axios.get(`https://api.themoviedb.org/3/movie/${movieId}?region=VN&language=vi-VN`, {
      headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
    }),

    axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
      headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
    }),

    axios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos`, {
      headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
    }),
  ]);

  const movieApiData = movieDetailsResponse.data;
  const movieCreditsApiData = movieCreditsResponse.data;
  const movieVideosApiData = movieVideosResponse.data;

  // Lấy trailer chính thức (nếu có)
  const trailer = movieVideosApiData.results.find((v) => v.type === "Trailer" && v.site === "YouTube");

  const movieDetails = {
    _id: movieId,
    title: movieApiData.title,
    overview: movieApiData.overview || "Đang cập nhật",
    poster_path: movieApiData.poster_path,
    backdrop_path: movieApiData.backdrop_path || movieApiData.poster_path,
    release_date: movieApiData.release_date,
    original_language: movieApiData.original_language,
    tagline: movieApiData.tagline || "",
    genres: movieApiData.genres,
    casts: movieCreditsApiData.cast,
    vote_average: movieApiData.vote_average,
    runtime: movieApiData.runtime,
    isDeleted: false,
    isFeatured: false,
    status: new Date() > new Date(movieApiData.release_date) ? "now_showing" : "upcoming",
    // thêm trailer (nếu có YouTube key)
    trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
  };
  // Add movie details to the database
  movie = await Movie.create(movieDetails);

  return;
};
