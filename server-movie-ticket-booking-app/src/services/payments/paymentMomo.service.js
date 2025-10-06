import axios from "axios";
import { createMomoSignature } from "../../utils/momo.js";
import { BadRequestError } from "../../core/error.response.js";
import PaymentLog from "../../models/paymentLog.model.js";
import { paymentQueue } from "../queues/paymentQueue.service.js";
import { updateBooking } from "../updateBooking.service.js";

export async function createMomoPayment({ orderId, amount, originUrl }) {
  const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";
  const { MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY, RETURNURL } = process.env;

  const requestId = `${orderId}-${Date.now()}`;
  const orderInfo = `Thanh toán đơn hàng #${orderId}`;
  const redirectUrl = `${originUrl}/loading/my-bookings`; //"http://localhost:3000/payment/success";
  const ipnUrl = `${RETURNURL}/v1/api/payment/momo/callback`;
  const requestType = "payWithMethod";

  const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const signature = createMomoSignature(MOMO_SECRET_KEY, rawSignature);

  const body = {
    partnerCode: MOMO_PARTNER_CODE,
    accessKey: MOMO_ACCESS_KEY,
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    requestType,
    extraData: "",
    signature,
    lang: "vi",
  };

  const response = await axios.post(endpoint, body);
  const paymentLog = await PaymentLog.create({
    provider: "MoMo",
    bookingId: orderId,
    rawData: { orderId },
    status: "PENDING",
    steps: {
      updateBooking: { status: "PENDING" },
      sendMail: { status: "PENDING" },
    },
  });
  return response.data; // có payUrl
}

export const momoCallback = async (req, res) => {
  try {
    const { orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, extraData, signature } = req.body;
    // ✅ Verify chữ ký
    const { MOMO_ACCESS_KEY, MOMO_SECRET_KEY, MOMO_PARTNER_CODE } = process.env;

    const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${MOMO_PARTNER_CODE}&payType=${payType}&requestId=${requestId}&responseTime=${req.body.responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const checkSignature = crypto.createHmac("sha256", MOMO_SECRET_KEY).update(rawSignature).digest("hex");

    if (checkSignature !== signature) {
      throw new BadRequestError("Invalid signature");
    }

    // ✅ Nếu thanh toán thông báo kết quả
    // const dataJson = JSON.parse(req.body);
    // ✅ Nếu thanh toán thành công
    if (resultCode === 0) {
      // Tìm log đã tạo ở bước tạo link
      let paymentLog = await PaymentLog.findOne({ bookingId: orderId, provider: "MoMo" });
      if (!paymentLog) {
        // fallback: tạo mới nếu vì lý do nào đó không tồn tại
        paymentLog = await PaymentLog.create({
          provider: "MoMo",
          bookingId: orderId,
          rawData: req.body,
          status: "PENDING",
          steps: {
            updateBooking: { status: "PENDING" },
            sendMail: { status: "PENDING" },
          },
        });
      } else {
        // cập nhật rawData từ callback
        paymentLog.rawData = req.body;
        // paymentLog.status = "PENDING";
        await paymentLog.save();
      }

      await updateBooking({ bookingLogId: paymentLog._id });
      /*
      // Push vào queue
      await paymentQueue.add("updateBooking", { logId: paymentLog._id });
      console.log("✅ Pushed updateBooking to queue");
      */
    }

    // Momo yêu cầu trả về 200 OK để xác nhận đã nhận callback
    return;
  } catch (error) {
    console.error("Momo callback error:", error);
    throw error;
  }
};
