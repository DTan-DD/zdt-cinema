"use strict";
import dotenv from "dotenv";
dotenv.config();

export default {
  zaloPay: {
    app_id: process.env.ZALO_APP_ID || 2554,
    key1: process.env.ZALOPAY_KEY_1,
    key2: process.env.ZALOPAY_KEY_2,
    endpoint: process.env.ZALO_ENDPOINT || "https://sb-openapi.zalopay.vn/v2",
    callback_url: `${process.env.RETURNURL}/v1/api/payment/zalopay/callback`,
  },

  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn",
  },

  vnpay: {
    tmnCode: process.env.VNP_TMNCODE,
    hashSecret: process.env.VNP_HASHSECRET,
    endpoint: process.env.VNP_ENDPOINT || "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
    api: process.env.VNP_API || "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
  },

  // fallback chung
  env: process.env.NODE_ENV || "development",
};
