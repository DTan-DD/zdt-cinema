"use strict";

import { successResponse } from "../core/success.response.js";
import {
  isAdmin,
  getDashboardData,
  getAllShows,
  getAllBookings,
  updateShow,
  updateBooking,
  updateMovie, //
  deleteShow,
  deleteBooking,
  deleteMovie,
} from "../services/admin.service.js";

class AdminController {
  isAdmin = async (req, res, next) => {
    new successResponse({
      message: "User is admin ",
      metadata: await isAdmin(req),
    }).send(res);
  };

  getDashboardData = async (req, res, next) => {
    new successResponse({
      message: "Get dashboard data successfully ",
      metadata: await getDashboardData(req),
    }).send(res);
  };

  getAllShows = async (req, res, next) => {
    new successResponse({
      message: "Get all shows successfully ",
      metadata: await getAllShows(req),
    }).send(res);
  };

  getAllBookings = async (req, res, next) => {
    new successResponse({
      message: "Get all bookings successfully ",
      metadata: await getAllBookings(req),
    }).send(res);
  };

  updateShow = async (req, res, next) => {
    new successResponse({
      message: "Update show successfully ",
      metadata: await updateShow(req),
    }).send(res);
  };

  updateBooking = async (req, res, next) => {
    new successResponse({
      message: "Update booking successfully ",
      metadata: await updateBooking(req),
    }).send(res);
  };

  updateMovie = async (req, res, next) => {
    new successResponse({
      message: "Update movie successfully ",
      metadata: await updateMovie(req),
    }).send(res);
  };

  deleteShow = async (req, res, next) => {
    new successResponse({
      message: "Delete show successfully ",
      metadata: await deleteShow(req),
    }).send(res);
  };

  deleteBooking = async (req, res, next) => {
    new successResponse({
      message: "Delete booking successfully ",
      metadata: await deleteBooking(req),
    }).send(res);
  };

  deleteMovie = async (req, res, next) => {
    new successResponse({
      message: "Delete movie successfully ",
      metadata: await deleteMovie(req),
    }).send(res);
  };
}

export default new AdminController();
