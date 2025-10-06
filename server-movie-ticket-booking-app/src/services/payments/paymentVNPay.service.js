import qs from "qs";
import crypto from "crypto";
import moment from "moment";
import { sortObject } from "../../utils/VNPay.js";
import { paymentQueue } from "../queues/paymentQueue.service.js";
import PaymentLog from "../../models/paymentLog.model.js";
import { updateBooking } from "../updateBooking.service.js";

export async function createVNPayPayment({ orderId, amount, req, originUrl }) {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  const tmnCode = process.env.VNP_TMNCODE;
  const secretKey = process.env.VNP_HASHSECRET;
  const vnpUrl = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl = `${originUrl}/loading/my-bookings`;
  // chuẩn format giờ VN
  const date = new Date();
  const createDate = moment(date).format("YYYYMMDDHHmmss");

  // lấy IP thật
  const ipAddr = req?.headers["x-forwarded-for"] || req?.connection?.remoteAddress || req?.socket?.remoteAddress || "127.0.0.1";

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
    vnp_OrderType: "other",
    vnp_Amount: amount * 100, // nhân 100
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  // sort key
  vnp_Params = sortObject(vnp_Params);

  const signData = qs.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  vnp_Params["vnp_SecureHashType"] = "SHA512";
  vnp_Params["vnp_SecureHash"] = signed;

  const paymentLog = await PaymentLog.create({
    provider: "VNPay",
    bookingId: orderId,
    rawData: { vnp_TxnRef: orderId, vnp_CreateDate: createDate },
    status: "PENDING",
    steps: {
      updateBooking: { status: "PENDING" },
      sendMail: { status: "PENDING" },
    },
  });

  return `${vnpUrl}?${qs.stringify(vnp_Params, { encode: false })}`;
}

export const vnpayCallbackService = async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });

    const secretKey = process.env.VNP_HASHSECRET;
    const checkSum = crypto.createHmac("sha512", secretKey).update(signData, "utf-8").digest("hex");

    if (secureHash !== checkSum && vnp_Params["vnp_ResponseCode"] !== "00") {
      return res.status(200).json({ RspCode: "97", Message: "Invalid Signature" });
    }

    const orderId = vnp_Params["vnp_TxnRef"];

    // ✅ Ghi log callback trước
    const dataJson = vnp_Params;
    // Tìm log đã tạo ở bước tạo link
    let paymentLog = await PaymentLog.findOne({ bookingId: orderId, provider: "VNPay" });
    if (!paymentLog) {
      // fallback: tạo mới nếu vì lý do nào đó không tồn tại
      paymentLog = await PaymentLog.create({
        provider: "VNPay",
        bookingId: orderId,
        rawData: dataJson,
        status: "PENDING",
        steps: {
          updateBooking: { status: "PENDING" },
          sendMail: { status: "PENDING" },
        },
      });
    } else {
      // cập nhật rawData từ callback
      paymentLog.rawData = dataJson;
      // paymentLog.status = "PENDING";
      await paymentLog.save();
    }

    await updateBooking({ bookingLogId: paymentLog._id });

    /*
    // Push vào queue
    await paymentQueue.add("updateBooking", { logId: paymentLog._id });
    console.log("✅ Pushed updateBooking to queue");
    */

    return { RspCode: "00", Message: "Confirm Success" };
  } catch (error) {
    console.error(error);
    throw error;
  }
};
