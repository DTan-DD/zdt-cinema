import { rabbitMQ } from "../../../configs/rabbitmqV2.config.js";

export class QueueService {
  static async publish(channelName, data, options = { persistent: true }) {
    try {
      const { channel, queue } = rabbitMQ.getChannel(channelName);
      const payload = Buffer.from(JSON.stringify(data));

      const sent = channel.sendToQueue(queue, payload, options);

      if (sent) {
        console.log(`✅ [QueueService] Job queued to ${channelName}:`, data);
        return true;
      } else {
        console.warn(`⚠️ [QueueService] Failed to send job to ${channelName}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [QueueService] publish error for ${channelName}:`, error.message);
      throw error;
    }
  }
}

// Legacy functions for backward compatibility
export const publishPaymentJob = (data) => QueueService.publish("payment", data);
export const publishMailJob = (data) => QueueService.publish("mail", data);
export const publishNotificationJob = (data) => QueueService.publish("noti", data);
