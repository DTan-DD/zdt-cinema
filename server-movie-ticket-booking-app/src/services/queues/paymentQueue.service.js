import { Queue } from "bullmq";
import { connectRedis } from "../../../configs/redisConnection.config.js";

let connection;

const initQueue = async () => {
  connection = await connectRedis();

  await connection.set("test:key", "Hello Upstash!");
  const val = await connection.get("test:key");
  console.log("✅ Redis connection OK:", val);

  return new Queue("paymentQueue", {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 10000,
      },
      removeOnComplete: true,
      removeOnFail: 5,
    },
  });
};

export const paymentQueue = await initQueue();
