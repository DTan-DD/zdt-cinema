import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";

// API to get now playing movies from TMDB API
export const getNowPlayingMovies = async (req, res) => {
  const url = "https://api.themoviedb.org/3/movie/now_playing";
  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
    });
    const movies = data.results;
    console.log("hello");
    res.status(200).json({ success: true, movies: movies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// API to add a new show to the database
export const addShow = async (req, res) => {
  try {
    const { movieId, cinemasInput, showPrice } = req.body;
    // console.log(req.body); //  req.body
    let movie = await Movie.findOne({ _id: movieId });

    if (!movie) {
      // Fetch movie details and credits from TMDB API
      const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),

        axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
          headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` },
        }),
      ]);

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsApiData = movieCreditsResponse.data;

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        genres: movieApiData.genres,
        casts: movieCreditsApiData.cast,
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime,
      };

      //   Add movie details to the database
      movie = await Movie.create(movieDetails);
    }

    const showsToCreate = [];

    cinemasInput.forEach((cinema) => {
      cinema.shows.forEach((s) => {
        s.times.forEach((time) => {
          const dateTimeString = `${s.date}T${time}`;
          showsToCreate.push({
            movie: movieId,
            cinema: cinema.cinemaId,
            showDateTime: new Date(dateTimeString),
            showPrice,
            occupiedSeats: {},
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
      data: {
        movieId: movieId,
      },
    });

    res.status(201).json({ success: true, message: "Show added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// API to get all shows from dbs
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({ showDateTime: { $gte: new Date() } })
      .populate("movie")
      .sort({ showDateTime: 1 });

    //   filter unique shows
    const uniqueShows = new Set(shows.map((show) => show.movie));

    res.status(200).json({ success: true, shows: Array.from(uniqueShows) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// API to get a single show from dbs
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    // get all coming shows for the movie
    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    }).populate("cinema"); // lấy luôn thông tin rạp

    const movie = await Movie.findById(movieId);
    // console.log(shows);
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

    res.status(200).json({ success: true, movie, dateTime });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getShowById = async (req, res) => {
  try {
    const { showId } = req.params;
    // get all coming shows for the movie
    const show = await Show.findById(showId).populate("cinema movie"); // lấy luôn thông tin rạp

    const movie = await Movie.findById(show.movie);
    // console.log(show);

    res.status(200).json({ success: true, movie, show });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
