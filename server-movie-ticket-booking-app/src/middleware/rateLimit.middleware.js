import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = new Redis(redisUrl, {
  tls: redisUrl.includes("upstash") ? { rejectUnauthorized: false } : undefined,
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 100, // số request cho phép
  duration: 60, // trong 60 giây
  blockDuration: 60, // nếu quá limit thì block trong 1 phút
});

export const rateLimitMiddleware = (req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      res.status(429).json({
        success: false,
        error: "Too many requests",
      });
    });
};
