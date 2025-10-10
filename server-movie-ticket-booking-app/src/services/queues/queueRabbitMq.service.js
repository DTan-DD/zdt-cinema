// queues/paymentQueue.js
import { getChannel } from "../../../configs/rabbitmq.config.js";

/**
 * 🔹 Hàm publish job vào hàng đợi payment_queue
 * @param {Object} data - Dữ liệu cần xử lý (VD: bookingId, email, status)
 */
export const publishPaymentJob = async (data) => {
  try {
    const { channel, queue } = getChannel("payment");

    // Convert sang buffer để gửi vào RabbitMQ
    const payload = Buffer.from(JSON.stringify(data));

    // Gửi message vào queue
    const sent = await channel.sendToQueue(queue, payload, {
      persistent: true, // message không mất nếu broker restart
    });

    if (sent) {
      console.log("✅ [RabbitMQ] Payment job queued:", data);
    } else {
      console.warn("⚠️ [RabbitMQ] Failed to send payment job:", data);
    }
  } catch (error) {
    console.error("❌ [RabbitMQ] publishPaymentJob error:", error.message);
  }
};

// ✅ Publish vào mail_queue (cho sendMail)
export const publishMailJob = async (data) => {
  try {
    const { channel, queue } = getChannel("mail"); // ⚡ Đổi sang "mail"
    const payload = Buffer.from(JSON.stringify(data));

    const sent = channel.sendToQueue(queue, payload, { persistent: true });

    if (sent) {
      console.log("✅ [RabbitMQ] Mail job queued:", data);
    } else {
      console.warn("⚠️ [RabbitMQ] Failed to send mail job");
    }
  } catch (error) {
    console.error("❌ [RabbitMQ] publishMailJob error:", error.message);
  }
};

// ✅ Publish vào noti_queue (cho sendNoti)
export const publishNotificationJob = async (data) => {
  try {
    const { channel, queue } = getChannel("noti"); // ⚡ Đổi sang "noti"
    const payload = Buffer.from(JSON.stringify(data));

    const sent = await channel.sendToQueue(queue, payload, { persistent: true });

    if (sent) {
      console.log("✅ [RabbitMQ] Noti job queued:", data);
    } else {
      console.warn("⚠️ [RabbitMQ] Failed to send noti job");
    }
  } catch (error) {
    console.error("❌ [RabbitMQ] publishNotiJob error:", error.message);
  }
};
