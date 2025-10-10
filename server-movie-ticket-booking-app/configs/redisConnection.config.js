// src/config/redisConnection.js
import IORedis from "ioredis";

let redisClient = null;

export const getRedisConnection = () => {
  if (!redisClient) {
    redisClient = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true, // 🚀 Chỉ kết nối khi gọi .connect()
    });

    redisClient.on("error", (err) => {
      console.error("Redis error:", err.message);
    });
  }

  return redisClient;
};

// ✅ Hàm connect thủ công khi cần
export const connectRedis = async () => {
  const client = getRedisConnection();
  if (!client.status || client.status === "end") {
    await client.connect();
  }
  return client;
};

// ✅ Hàm ngắt kết nối khi xong
export const disconnectRedis = async () => {
  if (redisClient && redisClient.status === "ready") {
    await redisClient.quit();
    redisClient = null;
  }
};
