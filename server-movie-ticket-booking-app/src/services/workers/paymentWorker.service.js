import { BaseWorker } from "./baseWorker.service.js";
import { DLQHandler } from "./dlqHandler.service.js";
import { publishMailJob } from "../queues/queueRabbitMqV2.service.js";
import PaymentLog from "../../models/paymentLog.model.js";
import Booking from "../../models/booking.model.js";
import { BaseWorkerWithRetry } from "./baseWorkerWithRetry.service.js";

export class PaymentWorker extends BaseWorkerWithRetry {
  constructor() {
    super("payment", "payment_queue", {
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
    });
  }

  async processMessage(payload, msg) {
    const { logId } = payload;

    console.log(`🚀 [PaymentWorker] Processing updateBooking logId=${logId}`);

    const log = await PaymentLog.findById(logId);
    if (!log) throw new Error("PaymentLog not found");

    // Avoid duplicate processing
    if (log.steps.updateBooking.status === "SUCCESS") {
      console.log(`⚠️ [PaymentWorker] Booking ${log.bookingId} already processed`);
      this.channel.ack(msg);
      return;
    }

    const booking = await Booking.findById(log.bookingId);
    if (!booking) throw new Error("Booking not found");

    if (booking.isDeleted) throw new Error("Booking is deleted");

    // Update booking
    booking.isPaid = true;
    booking.paymentLink = log.provider;
    booking.paymentDate = new Date();
    await booking.save();

    // Update log
    log.steps.updateBooking.status = "SUCCESS";
    log.steps.updateBooking.attempts += 1;
    await log.save();

    console.log(`✅ [PaymentWorker] Booking ${booking._id} marked as PAID (${log.provider})`);

    // Push mail job
    await publishMailJob({ logId });

    this.channel.ack(msg);
  }

  async handleError(error, msg) {
    console.error("❌ [PaymentWorker] Error:", error.message);

    try {
      const payload = this.parseMessage(msg);
      const { logId } = payload;

      const log = await PaymentLog.findById(logId);
      if (log) {
        log.steps.updateBooking.status = "FAILED";
        log.steps.updateBooking.attempts += 1;
        log.steps.updateBooking.lastError = error.message;
        await log.save();
      }

      // Send to DLQ
      await DLQHandler.sendToDLQ(payload, error, this.queueName);
    } catch (subErr) {
      console.error("⚠️ [PaymentWorker] Failed to log error:", subErr.message);
    }

    this.channel.nack(msg, false, false);
  }
}
