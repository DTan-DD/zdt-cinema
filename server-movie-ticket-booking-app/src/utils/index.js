"use strict";

import { customAlphabet } from "nanoid";
import myloggerLog from "../loggers/mylogger.log.js";
import { clerkClient } from "@clerk/express";

export const nanoidBooking = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

export const nanoidTicket = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 10);

export const logError = (error, req, res, next) => {
  const responseTime = error.now ? Date.now() - error.now : "unknown";
  const resMessage = `${error.status} - ${responseTime}ms - Response: ${JSON.stringify(error)}`;
  const logData = [req.path, { requestId: req.requestId }, { message: error.message }];

  myloggerLog.error(resMessage, logData);
};

// get admins from clerk
export const getAdmins = async () => {
  const { data } = await clerkClient.users.getUserList({
    limit: 5, // tuỳ
  });
  // lọc ra user có role admin trong metadata
  const adminUsers = data.filter((u) => u.privateMetadata?.role === "admin");
  return adminUsers;
};

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
