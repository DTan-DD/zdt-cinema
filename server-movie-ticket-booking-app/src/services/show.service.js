"use strict";

import axios from "axios";
import Movie from "../models/movie.model.js";
import Show from "../models/show.model.js";
import { inngest } from "../inngest/index.js";

// API to get now playing movies from TMDB API
export const getNowPlayingMoviesFromApi = async (req, res) => {
  const today = new Date();
  const cutoff = new Date();
  cutoff.setDate(today.getDate() - 45); // chỉ lấy phim ra mắt trong 45 ngày qua

  const nowPlayingUrl = "https://api.themoviedb.org/3/movie/now_playing?region=VN";
  const upcomingUrl = "https://api.themoviedb.org/3/movie/upcoming?region=VN";

  const headers = { Authorization: `Bearer ${process.env.TMDB_API_KEY}` };

  // Gọi song song 2 API
  const [nowPlayingRes, upcomingRes] = await Promise.all([axios.get(nowPlayingUrl, { headers }), axios.get(upcomingUrl, { headers })]);

  // Lọc phim đang chiếu (ra mắt trong 45 ngày gần đây)
  const filteredNowPlaying = nowPlayingRes.data.results.filter((movie) => {
    const release = new Date(movie.release_date);
    return release >= cutoff && release <= today;
  });

  // Lấy phim sắp chiếu
  const upcomingMovies = upcomingRes.data.results;

  // Gộp lại
  const allMovies = [...filteredNowPlaying, ...upcomingMovies];

  const availableMoviesInDbs = await Movie.find();

  // Lọc phim trong dbs
  const filteredMoviesInDbs = allMovies.filter((movie) => !availableMoviesInDbs.some((dbMovie) => Number(dbMovie._id) === movie.id));

  // Sắp xếp theo ngày phát hành (mới nhất trước)
  filteredMoviesInDbs.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));

  return { movies: filteredMoviesInDbs };
};

// API to get all movies from dbs
export const getAvailableMovies = async (req, res) => {
  const movies = await Movie.find({ status: { $in: ["now_showing", "upcoming"] } }).sort({ release_date: -1 }); // sắp xếp theo ngày tạo
  return { movies };
};

// API to add a new show to the database
export const addShow = async (req, res) => {
  const { movieId, cinemasInput, showPrice } = req.body;
  let movie = await Movie.findOne({ _id: movieId });

  if (!movie) {
    throw new BadRequestError("Movie not found");
  }

  const movieReleaseDate = new Date(movie.release_date); // ensure it's Date type
  const showsToCreate = [];

  cinemasInput.forEach((cinema) => {
    cinema.shows.forEach((s) => {
      s.times.forEach((time) => {
        const dateTimeString = `${s.date}T${time}`;
        const showDateTime = new Date(dateTimeString);

        // validate showDateTime
        if (showDateTime < movieReleaseDate) {
          throw new BadRequestError(`Show time ${showDateTime.toISOString()} must be on or after movie release date ${movieReleaseDate.toISOString()}`);
        }
        if (showDateTime < new Date()) {
          throw new BadRequestError(`Show time ${showDateTime.toISOString()} must be in the future`);
        }

        showsToCreate.push({
          movie: movieId,
          cinema: cinema.cinemaId,
          showDateTime,
          showPrice,
          occupiedSeats: {},
          runtime: movie.runtime,
        });
      });
    });
  });

  if (showsToCreate.length > 0) {
    await Show.insertMany(showsToCreate);
  }

  // Trigger Inngest event
  await inngest.send({
    name: "app/show.added",
    data: { movieId },
  });

  return;
};

// API to get all shows from dbs
export const getShows = async (req, res) => {
  const shows = await Show.find({ showDateTime: { $gte: new Date() }, isPublished: true })
    .populate("movie")
    .sort({ showDateTime: 1 });

  //   filter unique shows
  const uniqueShows = new Set(shows.map((show) => show.movie));

  return { shows: Array.from(uniqueShows) };
};

export const searchNowShowingMovies = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, error: "Missing search query" });
    }

    // Query trực tiếp trong MongoDB
    const shows = await Show.find({
      showDateTime: { $gte: new Date() },
      isPublished: true,
    })
      .populate({
        path: "movie",
        match: { title: { $regex: q, $options: "i" } }, // lọc ngay trong populate
        select: "title poster_path vote_average release_date backdrop_path runtime genres", // chỉ lấy field cần thiết
      })
      .sort({ showDateTime: 1 });

    // lọc bỏ show nào mà movie không match (null)
    const matchedMovies = shows.map((show) => show.movie).filter((movie) => movie);

    // unique movie theo _id
    const uniqueMovies = [];
    const seen = new Set();

    for (const movie of matchedMovies) {
      if (!seen.has(movie._id.toString())) {
        seen.add(movie._id.toString());
        uniqueMovies.push(movie);
      }
    }

    return { shows: uniqueMovies };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getShowByCinema = async (req, res) => {
  const { cinemaId } = req.params;

  const shows = await Show.find({
    showDateTime: { $gte: new Date() },
    isPublished: true,
    cinema: cinemaId,
  })
    .populate("movie")
    .sort({ showDateTime: 1 });

  // Gom nhóm theo movie
  const movieMap = {};

  shows.forEach((show) => {
    const movieId = show.movie._id;

    if (!movieMap[movieId]) {
      movieMap[movieId] = {
        _id: movieId,
        movie: {
          title: show.movie.title,
          poster_path: show.movie.poster_path,
          runtime: show.movie.runtime,
          genres: show.movie.genres,
        },
        showtimes: [],
      };
    }

    movieMap[movieId].showtimes.push({
      id: show._id,
      date: new Date(show.showDateTime).toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" }),
      time: new Date(show.showDateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      screen: show.screen || "Screen 1", // nếu có field screen thì lấy từ DB
      format: show.format || "2D", // tương tự
      language: show.language || "Eng Sub",
      price: show.showPrice,
    });
  });

  const result = Object.values(movieMap);

  return { movies: result };
};

export const getUpcomingShows = async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const movies = await Movie.find({ release_date: { $gte: today } }).sort({ showDateTime: 1 });
  //   filter unique
  const uniqueMovies = new Set(movies);

  return { movies: Array.from(uniqueMovies) };
};

// API to get a single show from dbs
export const getShow = async (req, res) => {
  const { movieId } = req.params;
  // get all coming shows for the movie
  const shows = await Show.find({
    movie: movieId,
    showDateTime: { $gte: new Date() },
  }).populate("cinema"); // lấy luôn thông tin rạp

  const movie = await Movie.findById(movieId);
  // cấu trúc mới: { date: { cinemaId: { cinemaName, times: [] } } }
  const dateTime = {};

  shows.forEach((show) => {
    const date = show.showDateTime.toISOString().split("T")[0];
    const cinemaId = show.cinema._id.toString();

    if (!dateTime[date]) {
      dateTime[date] = {};
    }

    if (!dateTime[date][cinemaId]) {
      dateTime[date][cinemaId] = {
        cinemaName: show.cinema.name,
        times: [],
      };
    }

    dateTime[date][cinemaId].times.push({
      time: show.showDateTime,
      showId: show._id,
    });
  });

  return { movie, dateTime };
};

export const getShowById = async (req, res) => {
  const { showId } = req.params;
  // get all coming shows for the movie
  const show = await Show.findById(showId).populate("cinema movie"); // lấy luôn thông tin rạp

  const movie = await Movie.findById(show.movie);

  return { movie, show };
};
