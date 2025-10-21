import { BaseWorker } from "./baseWorker.service.js";
import { DLQHandler } from "./dlqHandler.service.js";

export class BaseWorkerWithRetry extends BaseWorker {
  constructor(channelName, queueName, options = {}) {
    super(channelName, queueName, options);
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 5000; // 5 seconds
  }

  async processMessage(payload, msg) {
    const retryCount = msg.properties.headers?.["x-retry-count"] || 0;

    try {
      await super.processMessage(payload, msg);
    } catch (error) {
      if (retryCount < this.maxRetries) {
        await this.handleRetry(payload, msg, retryCount, error);
      } else {
        await this.handleFinalFailure(payload, msg, error);
      }
    }
  }

  async handleRetry(payload, msg, retryCount, error) {
    console.log(`🔄 [Worker ${this.channelName}] Retry ${retryCount + 1}/${this.maxRetries}:`, error.message);

    // Delay trước khi retry
    await new Promise((resolve) => setTimeout(resolve, this.retryDelay * (retryCount + 1)));

    // Gửi lại message với retry count
    const retryPayload = {
      ...payload,
      _retryInfo: {
        attempt: retryCount + 1,
        lastError: error.message,
        timestamp: new Date().toISOString(),
      },
    };

    const retrySent = this.channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(retryPayload)), {
      persistent: true,
      headers: {
        ...msg.properties.headers,
        "x-retry-count": retryCount + 1,
        "x-last-error": error.message,
      },
    });

    if (retrySent) {
      this.channel.ack(msg);
      console.log(`✅ [Worker ${this.channelName}] Message requeued for retry`);
    } else {
      await this.handleFinalFailure(payload, msg, error);
    }
  }

  async handleFinalFailure(payload, msg, error) {
    console.error(`💀 [Worker ${this.channelName}] Final failure after ${this.maxRetries} retries:`, error.message);

    await DLQHandler.sendToDLQ(payload, error, this.queueName);
    this.channel.nack(msg, false, false);
  }
}
