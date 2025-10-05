"use strict";

import { successResponse } from "../core/success.response.js";
import { getAllMovies, addMovie } from "../services/movie.service.js";

class MovieController {
  getAllMovies = async (req, res, next) => {
    new successResponse({
      message: "get all movies successfully ",
      metadata: await getAllMovies(req),
    }).send(res);
  };

  addMovie = async (req, res, next) => {
    new successResponse({
      message: "add movie successfully ",
      metadata: await addMovie(req),
    }).send(res);
  };
}

export default new MovieController();
