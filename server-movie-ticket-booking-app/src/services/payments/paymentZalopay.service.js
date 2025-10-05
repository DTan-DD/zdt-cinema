import axios from "axios";
import moment from "moment";
import config from "../../../configs/config.js";
import { createMac } from "../../utils/zalopay.js";
import Booking from "../../models/booking.model.js";
import PaymentLog from "../../models/paymentLog.model.js";
import { paymentQueue } from "../queues/paymentQueue.service.js";
import { BadRequestError } from "../../core/error.response.js";

/**
 * Tạo đơn hàng trên ZaloPay
 * @param {String} bookingId
 */
export async function createZalopayPayment({ orderId, originUrl }) {
  const booking = await Booking.findById(orderId);
  if (!booking) throw new Error("Booking not found");
  const embed_data = { redirecturl: `${originUrl}/loading/my-bookings` };
  // app_trans_id format yêu cầu: yymmdd_xxxx
  const appTransId = `${moment().format("YYMMDD")}_${booking._id}`;

  const order = {
    app_id: config.zaloPay.app_id,
    app_trans_id: appTransId,
    app_user: booking.user,
    app_time: Date.now(),
    item: JSON.stringify(booking.bookedSeats || []),
    embed_data: JSON.stringify(embed_data),
    amount: booking.amount,
    description: `Payment for booking ${booking._id}`,
    bank_code: "",
    callback_url: config.zaloPay.callback_url,
  };
  // Tạo MAC ký dữ liệu
  const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
  order.mac = createMac(config.zaloPay.key1, data);

  const result = await axios.post(`${config.zaloPay.endpoint}/create`, null, { params: order });
  // Lưu lại link thanh toán vào booking
  booking.paymentLink = result.data.order_url;
  await booking.save();

  const paymentLog = await PaymentLog.create({
    provider: "ZaloPay",
    bookingId: booking._id,
    rawData: { app_trans_id: appTransId },
    status: "PENDING",
    steps: {
      updateBooking: { status: "PENDING" },
      sendMail: { status: "PENDING" },
    },
  });

  return {
    bookingId: booking._id,
    paymentLink: booking.paymentLink,
    ...result.data,
  };
}

export async function zalopayCallbackService(dataStr, reqMac) {
  try {
    const mac = createMac(config.zaloPay.key2, dataStr);
    if (reqMac !== mac) {
      throw new BadRequestError("Invalid MAC");
    }

    const dataJson = JSON.parse(dataStr);
    const appTransId = dataJson["app_trans_id"]; // VD: 250910_bookingId
    const bookingId = appTransId.split("_")[1]; // lấy ra bookingId

    // ✅ Ghi log callback trước
    // Tìm log đã tạo ở bước tạo link
    let paymentLog = await PaymentLog.findOne({ bookingId, provider: "ZaloPay" });
    if (!paymentLog) {
      // fallback: tạo mới nếu vì lý do nào đó không tồn tại
      paymentLog = await PaymentLog.create({
        provider: "ZaloPay",
        bookingId,
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

    // Push vào queue
    await paymentQueue.add("updateBooking", { logId: paymentLog._id });
    console.log("✅ Pushed updateBooking to queue");
    return { return_code: 1, return_message: "queued" };
  } catch (error) {
    console.error(error);
    throw new BadRequestError(error.message);
  }
}
