// services/payment/reconciliation/momo.js
import axios from "axios";
import Booking from "../../models/Booking.js";
import config from "../../../configs/config.js";

export async function queryMoMo(orderId) {
  const data = {
    partnerCode: config.momo.partnerCode,
    orderId,
    requestId: orderId,
    lang: "vi",
    signature: "TODO", // ký giống lúc create order
  };

  const res = await axios.post(`${config.momo.endpoint}/query`, data);
  return res.data;
}

export async function reconcileMoMo(log) {
  const { MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY, RETURNURL } = process.env;

  const requestId = `${log.bookingId}-${Date.now()}`;
  const orderInfo = `Thanh toán đơn hàng #${log.bookingId}`;
  const redirectUrl = `${originUrl}/loading/my-bookings`; //"http://localhost:3000/payment/success";
  const ipnUrl = `${RETURNURL}/v1/api/payment/momo/callback`;
  const requestType = "payWithMethod";

  const rawSignature = `accessKey=${MOMO_ACCESS_KEY}&amount=${amount}&extraData=&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_PARTNER_CODE}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const signature = createMomoSignature(MOMO_SECRET_KEY, rawSignature);
  const orderId = log.rawData.orderId;
  const result = await queryMoMo(orderId);

  if (result.resultCode === 0) {
    // MoMo trả 0 = success
    const booking = await Booking.findById(log.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.isPaid) throw new Error("Booking already paid");

    // if (booking && !booking.isPaid) {
    booking.isPaid = true;
    booking.paymentLink = "MoMo";
    booking.paymentDate = new Date();
    await booking.save();
    console.log(`✅ Booking ${booking._id} reconciled as PAID`);
    // }

    log.status = "SUCCESS";
    log.steps.updateBooking.status = "SUCCESS";
    await log.save();

    // Send Confirmation Email await
    inngest.send({ name: "app/show.booked", data: { bookingId: booking._id } });
  }
}
