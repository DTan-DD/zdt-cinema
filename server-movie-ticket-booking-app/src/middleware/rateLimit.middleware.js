import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";

const redisClient = new Redis({
  host: "localhost",
  port: 6379,
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 100, // số request cho phép
  duration: 60, // trong 60 giây
  blockDuration: 60 * 1, // nếu quá limit thì block trong 15 phút
});

export const rateLimitMiddleware = (req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({
        success: false,
        error: "Too many requests",
      });
    });
};
