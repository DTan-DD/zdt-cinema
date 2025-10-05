import { Worker } from "bullmq";
import { io } from "../../../socket.js";
import Notification from "../../models/notification.model.js";
import { connectRedis, disconnectRedis } from "../../../configs/redisConnection.js";

const startNotificationWorker = async () => {
  const connection = await connectRedis();
  console.log("📡 Redis connected for Notification Worker");

  const notificationWorker = new Worker(
    "notificationQueue",
    async (job) => {
      console.log(`🔔 Running notificationWorker for job: ${job.name}`);

      const { notifId, receiverIds, type, title, message, meta } = job.data;

      // 1️⃣ Cập nhật trạng thái trong DB
      const notification = await Notification.findById(notifId);
      if (!notification) throw new Error("Notification not found");
      notification.status = "SENT";
      await notification.save();

      // 2️⃣ Gửi Socket.IO
      try {
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
        notification.status = "FAILED";
        await notification.save();
        throw err; // để BullMQ retry
      }
    },
    { connection }
  );

  // 3️⃣ Sự kiện hoàn thành job
  notificationWorker.on("completed", async (job) => {
    console.log(`✅ Job ${job.id} completed`);
    // Đóng Redis connection nếu worker idle
    await disconnectRedis();
  });

  // 4️⃣ Dead Letter Queue (DLQ)
  notificationWorker.on("failed", async (job, err) => {
    const maxAttempts = job.opts.attempts ?? 3;
    if (job.attemptsMade >= maxAttempts) {
      console.error(`🚨 Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
    }
  });
};

startNotificationWorker().catch((err) => {
  console.error("❌ Worker init failed:", err);
});
