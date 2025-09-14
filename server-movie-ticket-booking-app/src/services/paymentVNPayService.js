import qs from "qs";
import crypto from "crypto";
import moment from "moment";
import { sortObject } from "../utils/VNPay.js";

export const createVNPayPayment = ({ orderId, amount, req }) => {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  const tmnCode = process.env.VNP_TMNCODE;
  const secretKey = process.env.VNP_HASHSECRET;
  const vnpUrl = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl = process.env.VNP_RETURNURL || "https://www.youtube.com/";
  // console.log(process.env.VNP_TMNCODE);
  // console.log(process.env.VNP_HASHSECRET);
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
  // console.log("SignData:", signData);
  // console.log("Signed:", signed);

  vnp_Params["vnp_SecureHashType"] = "SHA512";
  vnp_Params["vnp_SecureHash"] = signed;

  return `${vnpUrl}?${qs.stringify(vnp_Params, { encode: false })}`;
};
