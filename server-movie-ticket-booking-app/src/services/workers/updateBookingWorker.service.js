// workers/paymentWorker.js
import { Worker } from "bullmq";
import PaymentLog from "../../models/paymentLog.model.js";
import Booking from "../../models/booking.model.js";
import { paymentQueue } from "../queues/paymentQueue.service.js";
import { connectRedis, disconnectRedis } from "../../../configs/redisConnection.js";

const startPaymentWorker = async () => {
  const connection = await connectRedis();
  console.log("💰 Redis connected for Payment Worker");

  const updateBookingWorker = new Worker(
    "paymentQueue",
    async (job) => {
      console.log(`🚀 Running updateBookingWorker for job: ${job.name}`);
      if (job.name !== "updateBooking") return;

      const { logId } = job.data;
      const log = await PaymentLog.findById(logId);
      if (!log) throw new Error("PaymentLog not found");

      // tránh xử lý trùng
      if (log.steps.updateBooking.status === "SUCCESS") return;

      try {
        const booking = await Booking.findById(log.bookingId);
        if (!booking) throw new Error("Booking not found");

        booking.isPaid = true;
        booking.paymentLink = log.provider;
        booking.paymentDate = new Date();
        await booking.save();

        log.steps.updateBooking.status = "SUCCESS";
        await log.save();

        console.log(`✅ Booking ${booking._id} reconciled as PAID via ${log.provider}`);

        // Gửi tiếp job sendMail
        await paymentQueue.add("sendMail", { logId }, { attempts: 3, backoff: 5000 });
      } catch (err) {
        log.steps.updateBooking.status = "FAILED";
        log.steps.updateBooking.attempts += 1;
        log.steps.updateBooking.lastError = err.message;
        await log.save();
        throw err; // để BullMQ retry
      }
    },
    {
      connection,
      settings: {
        stalledInterval: 0, // tắt hoàn toàn stalled job check
      },
    }
  );

  updateBookingWorker.on("completed", async (job) => {
    console.log(`✅ Job ${job.id} completed`);
    await disconnectRedis(); // đóng Redis khi idle
  });

  updateBookingWorker.on("failed", async (job, err) => {
    const maxAttempts = job.opts.attempts ?? 3;
    if (job.attemptsMade >= maxAttempts) {
      console.error(`🚨 Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
    }
  });
};

// ⚙️ Khởi động worker (Render sẽ auto chạy file này)
startPaymentWorker().catch((err) => {
  console.error("❌ Failed to start payment worker:", err);
});
