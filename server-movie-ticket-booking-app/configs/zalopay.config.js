import dotenv from "dotenv";
dotenv.config();
export default {
  app_id: 2554, // AppID test
  key1: process.env.ZALOPAY_KEY_1,
  key2: process.env.ZALOPAY_KEY_2,
  endpoint: "https://sb-openapi.zalopay.vn/v2", // sandbox
  callback_url: "http://localhost:3000/api/payment/callback",
};
