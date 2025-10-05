import { Worker } from "bullmq";
import IORedis from "ioredis";
import { io } from "../../../socket.js"; // socket.io instance
import Notification from "../../models/notification.model.js";
import { notificationQueue } from "../queues/notificationQueue.service.js";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const notificationWorker = new Worker(
  "notificationQueue",
  async (job) => {
    console.log(`🔔 Running notificationWorker for job: ${job.name}`);

    const { notifId, receiverIds, type, title, message, meta } = job.data;

    try {
      // 1. Update trạng thái trong DB
      const notification = await Notification.findById(notifId);
      if (!notification) throw new Error("Notification not found");
      notification.status = "SENT";
      await notification.save();

      // 2. Emit qua Socket.IO cho từng user
      receiverIds.forEach((userId) => {
        io.to(`user:${userId}`).emit("notification:new", {
          _id: notification._id,
          type,
          title,
          message,
          meta,
          createdAt: notification.createdAt,
        });
      });

      console.log(`✅ Notification sent to users: ${receiverIds.join(", ")}`);
    } catch (err) {
      console.error(`❌ Notification job failed:`, err.message);

      // Nếu lưu hoặc emit fail, update trạng thái trong DB
      notification.status = "FAILED";
      await notification.save();

      throw err; // để BullMQ retry
    }
  },
  { connection }
);

// DEAD LETTER: khi job fail vượt quá attempts
notificationWorker.on("failed", async (job, err) => {
  const maxAttempts = job.opts.attempts ?? 2; // fallback từ defaultJobOptions
  if (job.attemptsMade >= maxAttempts) {
    console.error(`🚨 Notification job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
  }
});
