// workers/paymentWorker.js
import { Worker } from "bullmq";
import IORedis from "ioredis";
import PaymentLog from "../../models/paymentLog.model.js";
import { inngest } from "../../inngest/index.js";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null, // ✅ bắt buộc cho BullMQ
});

const sendMailWorker = new Worker(
  "paymentQueue",
  async (job) => {
    if (job.name !== "sendMail") return;
    console.log("🚀 Running sendMailWorker...");
    const { logId } = job.data;
    const log = await PaymentLog.findById(logId);
    if (!log) throw new Error("PaymentLog not found");

    if (log.steps.sendMail.status === "SUCCESS") return;

    try {
      // Send Confirmation Email await
      await inngest.send({ name: "app/show.booked", data: { bookingId: log.bookingId } });

      log.steps.sendMail.status = "SUCCESS";
      log.status = "SUCCESS"; // cả quy trình OK
      await log.save();
    } catch (err) {
      log.steps.sendMail.status = "FAILED";
      log.steps.sendMail.attempts += 1;
      log.steps.sendMail.lastError = err.message;
      await log.save();
      throw err; // cho BullMQ retry
    }
  },
  { connection }
);

// DEAD LETTER: khi job fail vượt quá attempts
sendMailWorker.on("failed", async (job, err) => {
  const maxAttempts = job.opts.attempts ?? 3; // fallback
  if (job.attemptsMade >= maxAttempts) {
    console.error(`🚨 Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
  }
});

export default sendMailWorker;
