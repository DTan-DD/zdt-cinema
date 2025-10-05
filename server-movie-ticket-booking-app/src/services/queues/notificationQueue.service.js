import { Queue } from "bullmq";
import { connectRedis } from "../../../configs/redisConnection.js";

let connection;

const initQueue = async () => {
  connection = await connectRedis();

  await connection.set("test:key", "Hello Upstash!");
  const val = await connection.get("test:key");
  console.log("✅ Redis connection OK:", val);

  return new Queue("notificationQueue", {
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
};

export const notificationQueue = await initQueue();
