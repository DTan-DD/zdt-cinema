import cron from "node-cron";
import axios from "axios";
import crypto from "crypto";
import config from "../../../configs/config.js";
import Booking from "../../models/booking.model.js";
import PaymentLog from "../../models/paymentLog.model.js";
import { sortObject } from "../../utils/VNPay.js";
import qs from "qs";
import moment from "moment";
import { inngest } from "../../inngest/index.js";

// Cron job chạy mỗi 10 phút
cron.schedule("*/10 * * * *", async () => {
  console.log("🔄 Running payment reconciliation job...");

  const providers = ["ZaloPay", "MoMo", "VNPay"];

  for (const provider of providers) {
    try {
      console.log(`📋 Checking ${provider} payments...`);

      // Lấy log pending hoặc failed cho từng provider
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const logs = await PaymentLog.find({
        provider: provider,
        status: { $in: ["PENDING", "FAILED"] },
        createdAt: { $gte: oneDayAgo },
      });
      for (const log of logs) {
        try {
          const result = await queryPaymentStatus(provider, log);

          if (isPaymentSuccess(provider, result)) {
            await processSuccessfulPayment(log, provider);
          }
        } catch (err) {
          console.error(`❌ Reconciliation error for ${provider} log ${log._id}:`, err.message);
        }
      }
    } catch (err) {
      console.error(`❌ Error processing ${provider}:`, err.message);
    }
  }
});

/**
 * Hàm query chung cho tất cả payment providers
 * @param {string} provider - Tên provider (ZaloPay, MoMo, VNPay)
 * @param {Object} log - Payment log object
 * @returns {Object} Response từ provider
 */
async function queryPaymentStatus(provider, log) {
  switch (provider) {
    case "ZaloPay":
      return await queryZaloPay(log.rawData.app_trans_id);

    case "MoMo":
      return await queryMoMo(log.rawData.orderId);

    case "VNPay":
      return await queryVNPay(log.rawData.vnp_TxnRef, log);

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Kiểm tra payment có thành công hay không
 * @param {string} provider - Tên provider
 * @param {Object} result - Response từ provider
 * @returns {boolean} True nếu payment thành công
 */
function isPaymentSuccess(provider, result) {
  switch (provider) {
    case "ZaloPay":
      return result.return_code === 1 && result.sub_return_code === 1;

    case "MoMo":
      return result.resultCode === 0;

    case "VNPay":
      return result.vnp_ResponseCode === "00";

    default:
      return false;
  }
}

/**
 * Xử lý khi payment thành công
 * @param {Object} log - Payment log object
 * @param {string} provider - Tên provider
 */
async function processSuccessfulPayment(log, provider) {
  const booking = await Booking.findById(log.bookingId);

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.isPaid) {
    throw new Error("Booking already paid");
  }

  // Update booking
  booking.isPaid = true;
  booking.paymentLink = provider;
  booking.paymentDate = new Date();
  await booking.save();

  console.log(`✅ Booking ${booking._id} reconciled as PAID via ${provider}`);

  // Update log
  log.status = "SUCCESS";
  log.steps.updateBooking.status = "SUCCESS";
  await log.save();

  try {
    // Send confirmation email
    await inngest.send({
      name: "app/show.booked",
      data: { bookingId: booking._id },
    });
    log.steps.sendMail.status = "SUCCESS";
    await log.save();
  } catch (err) {
    throw err;
  }
}

// ==================== PROVIDER SPECIFIC FUNCTIONS ====================

/**
 * Query ZaloPay payment status
 */
export async function queryZaloPay(appTransId) {
  const data = {
    app_id: config.zaloPay.app_id,
    app_trans_id: appTransId,
  };

  // Tạo mac theo đúng format ZaloPay
  const dataStr = `${data.app_id}|${data.app_trans_id}|${config.zaloPay.key1}`;
  data.mac = crypto.createHmac("sha256", config.zaloPay.key1).update(dataStr).digest("hex");

  const res = await axios.post(`${config.zaloPay.endpoint}`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

/**
 * Query MoMo payment status
 */
export async function queryMoMo(orderId) {
  const rawData = {
    partnerCode: config.momo.partnerCode,
    requestId: orderId,
    orderId: orderId,
    lang: "vi",
  };

  const rawSignature = `accessKey=${config.momo.accessKey}&orderId=${orderId}&partnerCode=${config.momo.partnerCode}&requestId=${orderId}`;
  const signature = crypto.createHmac("sha256", config.momo.secretKey).update(rawSignature).digest("hex");

  const requestBody = {
    ...rawData,
    signature: signature,
  };

  const res = await axios.post(`${config.momo.endpoint}/v2/gateway/api/query`, requestBody);

  return res.data;
}

/**
 * Query VNPay payment status
 */
export async function queryVNPay(txnRef, log = null) {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  const vnp_RequestId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  const vnp_Version = "2.1.0";
  const vnp_Command = "querydr";
  const vnp_TmnCode = config.vnpay.tmnCode;
  const vnp_TxnRef = txnRef;
  const vnp_OrderInfo = `Thanh toan don hang ${txnRef}`;

  // Sử dụng createdAt của log làm TransactionDate (estimate)
  const vnp_TransactionDate = log.rawData.vnp_CreateDate;
  const date = new Date();
  const vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");
  const vnp_IpAddr = "127.0.0.1";

  // Tạo object data để sort
  const params = {
    vnp_RequestId,
    vnp_Version,
    vnp_Command,
    vnp_TmnCode,
    vnp_TxnRef,
    vnp_OrderInfo,
    vnp_TransactionDate,
    vnp_CreateDate,
    vnp_IpAddr,
  };

  const data = `${vnp_RequestId}|${vnp_Version}|${vnp_Command}|${vnp_TmnCode}|${vnp_TxnRef}|${vnp_TransactionDate}|${vnp_CreateDate}|${vnp_IpAddr}|${vnp_OrderInfo}`;

  const vnp_SecureHash = crypto.createHmac("sha512", config.vnpay.hashSecret).update(Buffer.from(data, "utf-8")).digest("hex");

  const requestBody = {
    ...params,
    vnp_SecureHash,
  };

  const res = await axios.post(`${config.vnpay.endpoint}`, requestBody, { headers: { "Content-Type": "application/json" } });
  return res.data;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Tạo MAC cho ZaloPay
 */
function createMac(key, data) {
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

/**
 * Generate request ID cho VNPay
 */
function generateRequestId() {
  return new Date().getTime().toString();
}

/**
 * Get current datetime in YYYYMMDDHHMMSS format
 */
function getCurrentDateTime() {
  return new Date()
    .toISOString()
    .replace(/[-:T.]/g, "")
    .slice(0, 14);
}

/**
 * Get transaction date (có thể cần adjust logic tùy theo requirement)
 */
function getTransactionDate() {
  return getCurrentDateTime(); // Hoặc lấy từ log.createdAt
}
