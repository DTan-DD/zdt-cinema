import amqp from "amqplib";
import { getChannel } from "../../../configs/rabbitmq.config.js";
import PaymentLog from "../../models/paymentLog.model.js";
import Booking from "../../models/booking.model.js";
import { publishMailJob, publishPaymentJob } from "../queues/queueRabbitMq.service.js";

export const startUpdateBookingWorker = async () => {
  const { channel, queue } = getChannel("payment");

  //   await channel.assertQueue(queue, { durable: true });

  console.log("💰 [Worker] Listening on queue:", queue);

  channel.consume(
    queue,
    async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());
        // if (payload.type !== "updateBooking") {
        //   channel.ack(msg); // bỏ qua message khác
        //   return;
        // }

        const { logId } = payload;
        console.log(`🚀 [Worker] Processing updateBooking logId=${logId}`);

        const log = await PaymentLog.findById(logId);
        if (!log) throw new Error("PaymentLog not found");

        // tránh xử lý trùng
        if (log.steps.updateBooking.status === "SUCCESS") {
          console.log(`⚠️ [Worker] Booking ${log.bookingId} already processed`);
          channel.ack(msg);
          return;
        }

        const booking = await Booking.findById(log.bookingId);
        if (!booking) throw new Error("Booking not found");

        // nếu booking hết hạn thanh toán, bỏ qua
        if (booking.isDeleted) throw new Error("Booking is deleted");

        // --- Update booking ---
        booking.isPaid = true;
        booking.paymentLink = log.provider;
        booking.paymentDate = new Date();
        await booking.save();

        // --- Update log ---
        log.steps.updateBooking.status = "SUCCESS";
        log.steps.updateBooking.attempts += 1;
        await log.save();

        console.log(`✅ [Worker] Booking ${booking._id} marked as PAID (${log.provider})`);

        // --- Push tiếp job sendMail ---
        // await publishPaymentJob({ type: "sendMail", logId });
        // ⚡ Đổi sang publishMailJob thay vì publishPaymentJob
        await publishMailJob({ logId });

        // xác nhận xử lý thành công
        channel.ack(msg);
      } catch (err) {
        console.error("❌ [Worker] updateBooking error:", err.message);

        try {
          const payload = JSON.parse(msg.content.toString());
          const { logId } = payload;
          const log = await PaymentLog.findById(logId);
          if (log) {
            log.steps.updateBooking.status = "FAILED";
            log.steps.updateBooking.attempts += 1;
            log.steps.updateBooking.lastError = err.message;
            await log.save();
          }
        } catch (subErr) {
          console.error("⚠️ [Worker] Failed to log error:", subErr.message);
        }

        // xử lý thất bại → requeue 1 lần duy nhất (tuỳ chọn)
        channel.nack(msg, false, false); // false,false = không requeue
      }
    },
    { noAck: false }
  );
};
