// services/payment/reconciliation/vnpay.js
import axios from "axios";
import Booking from "../../models/Booking.js";
import config from "../../../configs/config.js";

export async function queryVNPay(vnp_TxnRef) {
  const data = {
    vnp_Version: "2.1.0",
    vnp_Command: "querydr",
    vnp_TmnCode: config.vnpay.tmnCode,
    vnp_TxnRef,
    vnp_OrderInfo: "Reconcile",
    vnp_TransactionNo: Date.now(),
    vnp_CreateDate: new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14),
    vnp_IpAddr: "127.0.0.1",
  };

  // TODO: ký bằng vnp_HashSecret
  data.vnp_SecureHash = "TODO";

  const res = await axios.get(`${config.vnpay.endpoint}?${new URLSearchParams(data)}`);
  return res.data;
}

export async function reconcileVNPay(log) {
  const vnp_TxnRef = log.rawData.vnp_TxnRef;
  const result = await queryVNPay(vnp_TxnRef);

  if (result.vnp_ResponseCode === "00") {
    const booking = await Booking.findById(log.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.isPaid) throw new Error("Booking already paid");

    // if (booking && !booking.isPaid) {
    booking.isPaid = true;
    booking.paymentLink = "VNPay";
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
