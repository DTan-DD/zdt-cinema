"use strict";
import axios from "axios";
import { createMac } from "../../utils/index.js";
import Booking from "../../models/Booking.js";
import config from "../../../configs/zalopay.config.js";

export async function queryZaloPay(appTransId) {
  const data = {
    app_id: config.app_id,
    app_trans_id: appTransId,
  };
  const dataStr = `${data.app_id}|${data.app_trans_id}|${config.key1}`;
  data.mac = createMac(config.key1, dataStr);

  const res = await axios.post(`${config.endpoint}/v001/tpe/getstatusbyapptransid`, data);
  return res.data;
}

export async function reconcileZaloPay(log) {
  const appTransId = log.rawData.app_trans_id;
  const result = await queryZaloPay(appTransId);

  // Nếu ZaloPay báo thanh toán thành công
  if (result.return_code === 1 && result.sub_return_code === 1) {
    const booking = await Booking.findById(log.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.isPaid) throw new Error("Booking already paid");

    // if (booking && !booking.isPaid) {
    booking.isPaid = true;
    booking.paymentLink = "ZaloPay";
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
