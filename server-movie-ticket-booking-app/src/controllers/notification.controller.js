"use strict";

import { successResponse } from "../core/success.response.js";
import { getNotifications, markAllAsSeen, markAsRead } from "../services/notification.service.js";

class NotificationController {
  getNotifications = async (req, res, next) => {
    new successResponse({
      message: "get notifications successfully ",
      metadata: await getNotifications(req),
    }).send(res);
  };

  markAllAsSeen = async (req, res, next) => {
    new successResponse({
      message: "mark seen all notifications as seen successfully ",
      metadata: await markAllAsSeen(req),
    }).send(res);
  };

  markAsRead = async (req, res, next) => {
    new successResponse({
      message: "mark read notification as seen successfully ",
      metadata: await markAsRead(req),
    }).send(res);
  };
}

export default new NotificationController();
