import { BadRequestError, ServerErrorResponse } from "../core/error.response.js";
import IdempotencyKey from "../models/idempotencyKey.model.js";

export const idempotencyMiddleware = async (req, res, next) => {
  try {
    const key = req.headers["idempotency-key"];
    if (!key) {
      throw new BadRequestError("Missing idempotency key");
    }

    // Kiểm tra xem key đã tồn tại chưa
    const existing = await IdempotencyKey.findOne({ key });
    if (existing) {
      // Nếu có rồi → trả về response cũ
      return res.status(200).json(existing.response);
    }

    // Gắn key vào request để handler booking biết
    req.idempotencyKey = key;

    // Monkey patch res.json để capture response khi gửi về
    const originalJson = res.json;
    res.json = async function (body) {
      try {
        // Chỉ lưu nếu là success
        if (body && body.metadata?.success) {
          await IdempotencyKey.create({
            key,
            response: body,
          });
        }
      } catch (err) {
        console.error("Failed to save idempotency key:", err);
      }
      return originalJson.call(this, body);
    };

    next();
  } catch (err) {
    console.error("Idempotency middleware error:", err);
    throw new ServerErrorResponse("Idempotency middleware error");
  }
};
