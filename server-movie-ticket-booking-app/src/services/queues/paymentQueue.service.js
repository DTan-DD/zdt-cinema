// queues/paymentQueue.js
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null, // ✅ bắt buộc cho BullMQ
});

connection.set("test:key", "Hello Upstash!");
connection.get("test:key").then(console.log);

export const paymentQueue = new Queue("paymentQueue", {
  connection,
  defaultJobOptions: {
    attempts: 3, // retry tối đa 5 lần
    backoff: {
      type: "exponential", // delay tăng dần
      delay: 10000, // lần 1 chờ 10s, lần 2 chờ 20s, ...
    },
    removeOnComplete: true, // auto xóa job thành công
    removeOnFail: 5, // giữ lại 5 job fail gần nhất để debug
  },
});
