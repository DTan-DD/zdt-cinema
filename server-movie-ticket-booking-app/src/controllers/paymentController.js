import { createMomoPayment } from "../services/paymentMomoService.js";
import { createVNPayPayment } from "../services/paymentVNPayService.js";
import Booking from "../models/Booking.js";
import crypto from "crypto";
import { createMac } from "../utils/zalopay.js";
import { zalopayCallbackService } from "../services/paymentZalopayService.js";
import { sortObject } from "../utils/VNPay.js";
import qs from "qs";

// Tạo thanh toán
export const momoCheckout = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const momoResponse = await createMomoPayment({ orderId, amount });

    return res.status(200).json({
      success: true,
      payUrl: momoResponse.payUrl,
    });
  } catch (error) {
    console.error("Momo payment error:", error);
    return res.status(500).json({ success: false, message: "Tạo thanh toán thất bại" });
  }
};

// Callback khi Momo thông báo kết quả
export const momoCallback = async (req, res) => {
  try {
    const { orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, extraData, signature } = req.body;
    console.log(orderId);
    console.log("hello ban");
    // ✅ Verify chữ ký
    const { MOMO_ACCESS_KEY, MOMO_SECRET_KEY, MOMO_PARTNER_CODE } = process.env;

    const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${MOMO_PARTNER_CODE}&payType=${payType}&requestId=${requestId}&responseTime=${req.body.responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const checkSignature = crypto.createHmac("sha256", MOMO_SECRET_KEY).update(rawSignature).digest("hex");

    if (checkSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // ✅ Nếu thanh toán thành công
    if (resultCode === 0) {
      await Booking.findOneAndUpdate(
        { _id: orderId }, // giả sử orderId = booking._id
        { isPaid: true, paymentLink: "Momo" }
      );
      console.log(`Booking ${orderId} đã thanh toán thành công qua Momo`);
    } else {
      console.log(`Thanh toán thất bại cho booking ${orderId}, message: ${message}`);
    }

    // Momo yêu cầu trả về 200 OK để xác nhận đã nhận callback
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Momo callback error:", error);
    return res.status(500).json({ success: false, message: "Callback xử lý lỗi" });
  }
};

// VNPay
export const vnpayCheckout = (req, res) => {
  const { orderId, amount } = req.body;
  const payUrl = createVNPayPayment({ orderId, amount });
  return res.json({ success: true, payUrl });
};

// Xử lý returnUrl từ VNPay
export const vnpayCallback = async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];
    console.log("hello vnpay");

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });

    const secretKey = process.env.VNP_HASHSECRET;
    const checkSum = crypto.createHmac("sha512", secretKey).update(signData, "utf-8").digest("hex");
    console.log(checkSum);
    console.log(secureHash);
    console.log(vnp_Params["vnp_ResponseCode"]);

    if (secureHash === checkSum && vnp_Params["vnp_ResponseCode"] === "00") {
      const orderId = vnp_Params["vnp_TxnRef"];

      // Idempotent update (chạy nhiều lần không lỗi)
      console.log(orderId);
      await Booking.findByIdAndUpdate(orderId, { isPaid: true, paymentLink: "VNPay" });
      console.log(1);

      return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
    }

    console.log(2);
    return res.status(200).json({ RspCode: "97", Message: "Invalid Signature" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ RspCode: "99", Message: "Unknown error" });
  }
};

// Zalopay
export const zalopayCallback = async (req, res) => {
  try {
    const { data, mac } = req.body;
    const result = await zalopayCallbackService(data, mac);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.json({ return_code: 0, return_message: "error" });
  }
};
