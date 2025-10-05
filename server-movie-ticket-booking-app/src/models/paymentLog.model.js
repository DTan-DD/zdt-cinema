"use strict";
import { Schema, model } from "mongoose";

const DOCUMENT_NAME = "paymentLog";
const COLLECTION_NAME = "paymentLogs";

const paymentLogSchema = new Schema(
  {
    provider: { type: String, required: true }, // ZaloPay, MoMo, VNPay
    bookingId: { type: String, ref: "Booking" },
    rawData: Object,
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },

    steps: {
      updateBooking: {
        status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
        attempts: { type: Number, default: 0 },
        lastError: { type: String, default: null },
      },
      sendMail: {
        status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
        attempts: { type: Number, default: 0 },
        lastError: { type: String, default: null },
      },
    },
    error: { type: String }, // nếu xử lý lỗi thì log vào đây
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

const PaymentLog = model(DOCUMENT_NAME, paymentLogSchema);
export default PaymentLog;
