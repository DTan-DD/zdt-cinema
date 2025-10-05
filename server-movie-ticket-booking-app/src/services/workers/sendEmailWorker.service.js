// workers/paymentWorker.js
import { Worker } from "bullmq";
import PaymentLog from "../../models/paymentLog.model.js";
import { inngest } from "../../inngest/index.js";
import { connectRedis, disconnectRedis } from "../../../configs/redisConnection.js";

const startSendMailWorker = async () => {
  const connection = await connectRedis();
  console.log("📨 Redis connected for sendMailWorker");

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
        // Gửi email xác nhận (event tới Inngest)
        await inngest.send({
          name: "app/show.booked",
          data: { bookingId: log.bookingId },
        });

        log.steps.sendMail.status = "SUCCESS";
        log.status = "SUCCESS"; // toàn bộ flow OK
        await log.save();

        console.log(`✅ Mail sent successfully for booking ${log.bookingId}`);
      } catch (err) {
        log.steps.sendMail.status = "FAILED";
        log.steps.sendMail.attempts += 1;
        log.steps.sendMail.lastError = err.message;
        await log.save();

        console.error(`❌ sendMailWorker failed: ${err.message}`);
        throw err; // cho BullMQ retry
      }
    },
    { connection }
  );

  sendMailWorker.on("completed", async (job) => {
    console.log(`✅ Job ${job.id} done`);
    await disconnectRedis(); // đóng Redis khi xong
  });

  sendMailWorker.on("failed", async (job, err) => {
    const maxAttempts = job.opts.attempts ?? 3;
    if (job.attemptsMade >= maxAttempts) {
      console.error(`🚨 Job ${job.id} moved to DLQ after ${job.attemptsMade} attempts`);
    }
  });
};

// ⚙️ Khởi động worker
startSendMailWorker().catch((err) => {
  console.error("❌ Failed to start sendMailWorker:", err);
});
