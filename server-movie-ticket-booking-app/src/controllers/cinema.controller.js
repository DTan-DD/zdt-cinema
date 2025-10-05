"use strict";

import { successResponse } from "../core/success.response.js";
import { getAllCinemas, updateCinema } from "../services/cinema.service.js";

class CinemaController {
  getAllCinemas = async (req, res, next) => {
    new successResponse({
      message: "Get all cinemas successfully ",
      metadata: await getAllCinemas(req),
    }).send(res);
  };

  updateCinema = async (req, res, next) => {
    new successResponse({
      message: "Update cinema successfully ",
      metadata: await updateCinema(req),
    }).send(res);
  };
}

export default new CinemaController();
