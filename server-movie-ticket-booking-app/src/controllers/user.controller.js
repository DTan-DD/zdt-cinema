"use strict";

import { successResponse } from "../core/success.response.js";
import { getUserBookings, updateFavoriteMovie, getFavoriteMovies } from "../services/user.service.js";

class UserController {
  getUserBookings = async (req, res, next) => {
    new successResponse({
      message: "get user bookings successfully ",
      metadata: await getUserBookings(req),
    }).send(res);
  };

  updateFavoriteMovie = async (req, res, next) => {
    new successResponse({
      message: "update favorite movie successfully ",
      metadata: await updateFavoriteMovie(req),
    }).send(res);
  };

  getFavoriteMovies = async (req, res, next) => {
    new successResponse({
      message: "get favorite movies successfully ",
      metadata: await getFavoriteMovies(req),
    }).send(res);
  };
}

export default new UserController();
