"use strict";
import express from "express";
import { requireAuth } from "@clerk/express"; // middleware của Clerk
import notificationController from "../controllers/notification.controller.js";
import { protectAdmin } from "../middleware/auth.middeware.js";
import asyncHandler from "../middleware/asyncHandler.js";

const router = express.Router();

router.get("/", requireAuth(), protectAdmin, asyncHandler(notificationController.getNotifications));
router.post("/mask-all-seen", requireAuth(), protectAdmin, asyncHandler(notificationController.markAllAsSeen));
router.post("/mask-read/:type", requireAuth(), protectAdmin, asyncHandler(notificationController.markAsRead));

// chỉ admin mới được broadcast
// router.post("/", requireAuth(), protectAdmin, createNotification);

export default router;
