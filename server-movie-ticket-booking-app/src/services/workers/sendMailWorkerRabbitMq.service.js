import { getChannel } from "../../../configs/rabbitmq.config.js";
import { inngest } from "../../inngest/index.js";
import PaymentLog from "../../models/paymentLog.model.js";

export const startSendMailWorker = async () => {
  //   const channel = await getChannel();
  //   const queue = "paymentQueue";

  //   await channel.assertQueue(queue, { durable: true });
  const { channel, queue } = getChannel("mail");
  await channel.assertQueue(queueName, {
    durable: true,
  });

  // Set prefetch to 1 to ensure only one ack at a time
  channel.prefetch(1);
  console.log("📨 [Worker] Listening for sendMail jobs...");

  channel.consume(
    queue,
    async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());
        // if (payload.type !== "sendMail") {
        //   channel.ack(msg);
        //   return;
        // }

        const { logId } = payload;
        console.log(`🚀 [Worker] Processing sendMail for logId=${logId}`);

        const log = await PaymentLog.findById(logId);
        if (!log) throw new Error("PaymentLog not found");

        // Tránh xử lý trùng
        if (log.steps.sendMail.status === "SUCCESS") {
          console.log(`⚠️ [Worker] Mail already sent for booking ${log.bookingId}`);
          channel.ack(msg);
          return;
        }

        // --- Gửi email xác nhận ---
        await inngest.send({
          name: "app/show.booked",
          data: { bookingId: log.bookingId },
        });

        // --- Cập nhật log ---
        log.steps.sendMail.status = "SUCCESS";
        log.steps.sendMail.attempts += 1;
        log.status = "SUCCESS"; // toàn bộ flow OK
        await log.save();

        console.log(`✅ [Worker] Mail sent successfully for booking ${log.bookingId}`);

        channel.ack(msg);
      } catch (err) {
        console.error("❌ [Worker] sendMail error:", err.message);

        try {
          const payload = JSON.parse(msg.content.toString());
          const { logId } = payload;
          const log = await PaymentLog.findById(logId);
          if (log) {
            log.steps.sendMail.status = "FAILED";
            log.steps.sendMail.attempts += 1;
            log.steps.sendMail.lastError = err.message;
            await log.save();
          }
        } catch (subErr) {
          console.error("⚠️ [Worker] Failed to log mail error:", subErr.message);
        }

        // RabbitMQ: mark message failed (không requeue)
        channel.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
};
