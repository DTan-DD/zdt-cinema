"use strict";
import { Schema, model } from "mongoose";

const DOCUMENT_NAME = "notification";
const COLLECTION_NAME = "notifications";

const notificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["BOOKING", "SHOWTIME", "SYSTEM", "PROMOTION"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    receiverIds: [{ type: String, ref: "User" }],
    status: {
      type: String,
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
    },
    isRead: { type: Boolean, default: false },
    isSeen: { type: Boolean, default: false },
    meta: { type: Schema.Types.Mixed }, // JSON tự do
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

// Indexes gợi ý
notificationSchema.index({ receiverIds: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = model(DOCUMENT_NAME, notificationSchema);
export default Notification;
