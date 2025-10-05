// workers/paymentWorker.js
import { Worker } from "bullmq";
import IORedis from "ioredis";
import PaymentLog from "../../models/paymentLog.model.js";
import Booking from "../../models/booking.model.js";
import { inngest } from "../../inngest/index.js";
import { paymentQueue } from "../queues/paymentQueue.service.js";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null, // ✅ bắt buộc cho BullMQ
});

const updateBookingWorker = new Worker(
  "paymentQueue",
  async (job) => {
    console.log(`🚀 Running updateBookingWorker for job: ${job.name}`);
    if (job.name !== "updateBooking") return;
    console.log("🚀 Running updateBookingWorker...");
    const { logId } = job.data;
    const log = await PaymentLog.findById(logId);
    if (!log) throw new Error("PaymentLog not found");

    if (log.steps.updateBooking.status === "SUCCESS") return; // idempotency

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
      // Sau khi update booking thành công, push tiếp step sendMail
      await paymentQueue.add("sendMail", { logId }, { attempts: 3, backoff: 5000 });
    } catch (err) {
      log.steps.updateBooking.status = "FAILED";
      log.steps.updateBooking.attempts += 1;
      log.steps.updateBooking.lastError = err.message;
      await log.save();
      throw err; // cho BullMQ retry
    }
  },
  { connection }
);

// DEAD LETTER: khi job fail vượt quá attempts
updateBookingWorker.on("failed", async (job, err) => {
  const maxAttempts = job.opts.attempts ?? 3; // fallback
  if (job.attemptsMade >= maxAttempts) {
    console.error(`🚨 Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
  }
});

export default updateBookingWorker;
