"use strict";

import { successResponse } from "../core/success.response.js";
import {
  getAvailableMovies,
  getShows,
  getNowPlayingMoviesFromApi,
  getUpcomingShows,
  addShow,
  searchNowShowingMovies, //
  getShowByCinema,
  getShow,
  getShowById,
} from "../services/show.service.js";

class ShowController {
  getAvailableMovies = async (req, res, next) => {
    new successResponse({
      message: "Get available movies successfully ",
      metadata: await getAvailableMovies(req),
    }).send(res);
  };

  getShows = async (req, res, next) => {
    new successResponse({
      message: "Get shows successfully ",
      metadata: await getShows(req),
    }).send(res);
  };

  getNowPlayingMoviesFromApi = async (req, res, next) => {
    new successResponse({
      message: "Get now playing movies successfully ",
      metadata: await getNowPlayingMoviesFromApi(req),
    }).send(res);
  };

  getUpcomingShows = async (req, res, next) => {
    new successResponse({
      message: "Get upcoming shows successfully ",
      metadata: await getUpcomingShows(req),
    }).send(res);
  };

  getShowById = async (req, res, next) => {
    new successResponse({
      message: "Get show successfully ",
      metadata: await getShowById(req),
    }).send(res);
  };

  addShow = async (req, res, next) => {
    new successResponse({
      message: "Add show successfully ",
      metadata: await addShow(req),
    }).send(res);
  };

  searchNowShowingMovies = async (req, res, next) => {
    new successResponse({
      message: "Search now showing movies successfully ",
      metadata: await searchNowShowingMovies(req),
    }).send(res);
  };

  getShowByCinema = async (req, res, next) => {
    new successResponse({
      message: "Get show by cinema successfully ",
      metadata: await getShowByCinema(req),
    }).send(res);
  };

  getShow = async (req, res, next) => {
    new successResponse({
      message: "Get show successfully ",
      metadata: await getShow(req),
    }).send(res);
  };
}

export default new ShowController();
