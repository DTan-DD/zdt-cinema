import { rabbitMQ } from "../../../configs/rabbitmqV2.config.js";

export class BaseWorker {
  constructor(channelName, queueName, options = {}) {
    this.channelName = channelName;
    this.queueName = queueName;
    this.options = { durable: true, ...options };
    this.isRunning = false;
    this.channel = null;
  }

  async start() {
    if (this.isRunning) {
      console.log(`⚠️ [Worker ${this.channelName}] Already running`);
      return;
    }

    try {
      const { channel, queue } = await rabbitMQ.createChannel(this.channelName, this.queueName, this.options);
      this.channel = channel;

      channel.prefetch(1);
      await this.setupConsumer(channel, queue);

      this.isRunning = true;
      console.log(`🚀 [Worker ${this.channelName}] Started listening on ${queue}`);
    } catch (error) {
      console.error(`❌ [Worker ${this.channelName}] Failed to start:`, error.message);
      throw error;
    }
  }

  async setupConsumer(channel, queue) {
    channel.consume(
      queue,
      async (msg) => {
        if (!msg) return;

        try {
          const payload = this.parseMessage(msg);
          await this.processMessage(payload, msg);
        } catch (error) {
          await this.handleError(error, msg);
        }
      },
      { noAck: false }
    );
  }

  parseMessage(msg) {
    return JSON.parse(msg.content.toString());
  }

  async processMessage(payload, msg) {
    throw new Error("processMessage must be implemented by subclass");
  }

  async handleError(error, msg) {
    console.error(`❌ [Worker ${this.channelName}] Error:`, error.message);

    // Negative acknowledgment without requeue
    if (this.channel && msg) {
      this.channel.nack(msg, false, false);
    }
  }

  async stop() {
    this.isRunning = false;
    console.log(`🛑 [Worker ${this.channelName}] Stopped`);
  }
}
