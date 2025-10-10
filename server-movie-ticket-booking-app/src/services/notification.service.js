"use strict";
import Notification from "../models/notification.model.js";
import { io } from "../../socket.js"; // Socket.IO instance (export từ app.js)
import { notificationQueue } from "./queues/notificationQueue.service.js";
import { publishNotificationJob } from "./queues/queueRabbitMq.service.js";

export async function createNotification({ type, title, message, receiverIds, meta = {} }) {
  // Lưu vào MongoDB
  const notif = new Notification({
    type,
    title,
    message,
    receiverIds,
    meta,
  });
  await notif.save();

  // Push sang BullMQ để xử lý async (gửi email, push noti…)
  await notificationQueue.add("sendNotification", {
    type,
    title,
    message,
    notifId: notif._id,
    receiverIds,
  });

  await publishNotificationJob({
    type,
    title,
    message,
    notifId: notif._id,
    receiverIds,
    meta,
  });

  // Emit realtime qua Socket.IO (đẩy cho từng user trong receiverIds)
  receiverIds.forEach((userId) => {
    io.to(userId.toString()).emit("notification", notif);
  });

  return notif;
}

// 🟢 Lấy danh sách notification của user/admin
export const getNotifications = async (req, res) => {
  const { userId } = req.auth();
  const notifications = await Notification.find({
    receiverIds: userId,
  })
    .sort({ createdAt: -1 })
    .limit(25);

  return { data: notifications };
};

// 🟢 Đánh dấu đã đọc
export const markAsRead = async (req, res) => {
  const { userId } = req.auth();
  const { type } = req.params;
  await Notification.updateMany({ receiverIds: userId, type }, { $set: { isRead: true } }, { new: true });
  const notif = await Notification.find({ receiverIds: userId }).sort({ createdAt: -1 });

  return { data: notif };
};

export const markAllAsSeen = async (req, res) => {
  const { userId } = req.auth();
  await Notification.updateMany({ receiverIds: userId, isSeen: false }, { $set: { isSeen: true } });
  return;
};
