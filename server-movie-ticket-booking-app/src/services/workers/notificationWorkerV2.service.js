import { BaseWorker } from "./baseWorker.service.js";
import { DLQHandler } from "./dlqHandler.service.js";
import Notification from "../../models/notification.model.js";
import axios from "axios";

export class NotificationWorker extends BaseWorker {
  constructor() {
    super("noti", "noti_queue");
    this.socketApi = `${process.env.RETURNURL}/v1/api/socket/emit` || "http://localhost:3000/v1/api/socket/emit";
  }

  async processMessage(payload, msg) {
    const { notifId, receiverIds, type, title, message, meta } = payload;

    console.log(`🚀 [NotificationWorker] Processing notification: ${notifId}`);

    const notification = await Notification.findById(notifId);
    if (!notification) throw new Error("Notification not found");

    notification.status = "SENT";
    await notification.save();

    // Send socket notifications
    await this.sendSocketNotifications(receiverIds, notification, type, title, message, meta);

    console.log(`✅ [NotificationWorker] Notification sent to: ${receiverIds.join(", ")}`);
    this.channel.ack(msg);
  }

  async sendSocketNotifications(receiverIds, notification, type, title, message, meta) {
    for (const userId of receiverIds) {
      try {
        await axios.post(
          this.socketApi,
          {
            channel: `user:${userId}`,
            event: "notification:new",
            data: {
              _id: notification._id,
              type,
              title,
              message,
              meta,
              createdAt: notification.createdAt,
            },
          },
          {
            headers: { "x-api-key": process.env.EMIT_SECRET },
          }
        );
      } catch (error) {
        console.error(`❌ [NotificationWorker] Failed to send to user ${userId}:`, error.message);
        throw error; // Re-throw to trigger DLQ
      }
    }
  }

  async handleError(error, msg) {
    console.error("❌ [NotificationWorker] Error:", error.message);

    try {
      const payload = this.parseMessage(msg);
      const { notifId } = payload;

      const notification = await Notification.findById(notifId);
      if (notification) {
        notification.status = "FAILED";
        await notification.save();
      }

      await DLQHandler.sendToDLQ(payload, error, this.queueName);
    } catch (subErr) {
      console.error("⚠️ [NotificationWorker] Failed to log error:", subErr.message);
    }

    this.channel.nack(msg, false, false);
  }
}
