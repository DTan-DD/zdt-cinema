import { BaseWorker } from "./baseWorker.service.js";
import { DLQHandler } from "./dlqHandler.service.js";
import { inngest } from "../../inngest/index.js";
import PaymentLog from "../../models/paymentLog.model.js";

export class MailWorker extends BaseWorker {
  constructor() {
    super("mail", "mail_queue");
  }

  async processMessage(payload, msg) {
    const { logId } = payload;

    console.log(`🚀 [MailWorker] Processing sendMail for logId=${logId}`);

    const log = await PaymentLog.findById(logId);
    if (!log) throw new Error("PaymentLog not found");

    // Avoid duplicate processing
    if (log.steps.sendMail.status === "SUCCESS") {
      console.log(`⚠️ [MailWorker] Mail already sent for booking ${log.bookingId}`);
      this.channel.ack(msg);
      return;
    }

    // Send email
    await inngest.send({
      name: "app/show.booked",
      data: { bookingId: log.bookingId },
    });

    // Update log
    log.steps.sendMail.status = "SUCCESS";
    log.steps.sendMail.attempts += 1;
    log.status = "SUCCESS";
    await log.save();

    console.log(`✅ [MailWorker] Mail sent successfully for booking ${log.bookingId}`);
    this.channel.ack(msg);
  }

  async handleError(error, msg) {
    console.error("❌ [MailWorker] Error:", error.message);

    try {
      const payload = this.parseMessage(msg);
      const { logId } = payload;

      const log = await PaymentLog.findById(logId);
      if (log) {
        log.steps.sendMail.status = "FAILED";
        log.steps.sendMail.attempts += 1;
        log.steps.sendMail.lastError = error.message;
        await log.save();
      }

      await DLQHandler.sendToDLQ(payload, error, this.queueName);
    } catch (subErr) {
      console.error("⚠️ [MailWorker] Failed to log error:", subErr.message);
    }

    this.channel.nack(msg, false, false);
  }
}
