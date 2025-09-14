import axios from "axios";
import moment from "moment";
import config from "../../configs/zalopay.config.js";
import { createMac } from "../utils/zalopay.js";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";

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
    app_id: config.app_id,
    app_trans_id: appTransId,
    app_user: booking.user,
    app_time: Date.now(),
    item: JSON.stringify(booking.bookedSeats || []),
    embed_data: JSON.stringify(embed_data),
    amount: booking.amount,
    description: `Payment for booking ${booking._id}`,
    bank_code: "",
    callback_url: "https://movie-ticket-booking-app-eight.vercel.app/v1/api/payment/zalopay/callback",
  };
  console.log(config.key1);
  // Tạo MAC ký dữ liệu
  const data = `${order.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
  order.mac = createMac(config.key1, data);

  const result = await axios.post(`${config.endpoint}/create`, null, { params: order });
  // Lưu lại link thanh toán vào booking
  booking.paymentLink = result.data.order_url;
  await booking.save();

  return {
    bookingId: booking._id,
    paymentLink: booking.paymentLink,
    ...result.data,
  };
}

/**
 * Xử lý callback từ ZaloPay
 */
export async function zalopayCallbackService(dataStr, reqMac) {
  const mac = createMac(config.key2, dataStr);
  if (reqMac !== mac) {
    return { return_code: -1, return_message: "mac not equal" };
  }

  const dataJson = JSON.parse(dataStr);
  const appTransId = dataJson["app_trans_id"]; // VD: 250910_bookingId
  const bookingId = appTransId.split("_")[1]; // lấy ra bookingId

  const booking = await Booking.findById(bookingId);
  if (booking) {
    booking.isPaid = true;
    booking.paymentLink = "ZaloPay";
    await booking.save();

    // Send Confirmation Email
    await inngest.send({
      name: "app/show.booked",
      data: {
        bookingId,
      },
    });
  }

  return { return_code: 1, return_message: "success" };
}
