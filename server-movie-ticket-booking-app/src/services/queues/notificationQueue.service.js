// queues/paymentQueue.js
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null, // ✅ bắt buộc cho BullMQ
});

// 🔔 Queue chuyên cho Notification
export const notificationQueue = new Queue("notificationQueue", {
  connection,
  defaultJobOptions: {
    attempts: 2, // retry 2 lần là đủ (notification fail thì không critical)
    backoff: {
      type: "fixed",
      delay: 5000, // retry sau 5s
    },
    removeOnComplete: true, // không cần giữ log job thành công
    removeOnFail: 5, // giữ lại 5 job fail gần nhất để debug
  },
});
