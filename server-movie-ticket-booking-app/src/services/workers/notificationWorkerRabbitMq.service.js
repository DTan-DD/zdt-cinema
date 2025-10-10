import { getChannel } from "../../../configs/rabbitmq.config.js";
import Notification from "../../models/notification.model.js";
import axios from "axios";

export const startNotificationWorker = async () => {
  const SOCKET_API = `${process.env.RETURNURL}/v1/api/socket/emit` || "http://localhost:3000/v1/api/socket/emit";
  const { channel, queue } = getChannel("noti");

  console.log("🔔 [Worker] Listening for notification jobs...");

  channel.consume(
    queue,
    async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());
        const { notifId, receiverIds, type, title, message, meta } = payload;

        console.log(`🚀 [Worker] Processing notification job: ${notifId}`);

        // 1️⃣ Cập nhật trạng thái trong DB
        const notification = await Notification.findById(notifId);
        if (!notification) throw new Error("Notification not found");

        notification.status = "SENT";
        await notification.save();

        // 2️⃣ Gửi socket realtime
        try {
          // receiverIds.forEach((userId) => {
          //   io.to(`user:${userId}`).emit("notification:new", {
          //     _id: notification._id,
          //     type,
          //     title,
          //     message,
          //     meta,
          //     createdAt: notification.createdAt,
          //   });
          // });
          for (const userId of receiverIds) {
            await axios.post(
              SOCKET_API,
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
          }

          console.log(`✅ [Worker] Notification sent to: ${receiverIds.join(", ")}`);
        } catch (err) {
          notification.status = "FAILED";
          await notification.save();
          throw err;
        }

        // 3️⃣ ACK sau khi xử lý thành công
        channel.ack(msg);
      } catch (err) {
        console.error("❌ [Worker] notificationWorker error:", err.message);
        try {
          const payload = JSON.parse(msg.content.toString());
          const { notifId } = payload;
          const notification = await Notification.findById(notifId);
          if (notification) {
            notification.status = "FAILED";
            await notification.save();
          }
        } catch (subErr) {
          console.error("⚠️ [Worker] Failed to log error:", subErr.message);
        }

        // Không requeue để tránh lặp vô hạn
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
};
