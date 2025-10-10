import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
  points: 200, // số request cho phép
  duration: 60, // mỗi 60s
  blockDuration: 60, // nếu vượt thì block 1 phút
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
