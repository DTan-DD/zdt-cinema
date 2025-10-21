import { rabbitMQ } from "../../../configs/rabbitmqV2.config.js";

export class DLQHandler {
  static async sendToDLQ(originalMessage, error, queueName) {
    try {
      const dlqName = `${queueName}.dlq`;
      const { channel } = await rabbitMQ.createChannel(`dlq_${queueName}`, dlqName);

      const dlqMessage = {
        originalMessage: originalMessage,
        error: error.message,
        failedAt: new Date().toISOString(),
        queue: queueName,
        dlqReceivedAt: new Date().toISOString(), // Thêm timestamp
      };

      const sent = channel.sendToQueue(dlqName, Buffer.from(JSON.stringify(dlqMessage)), {
        persistent: true,
        headers: {
          "x-death": [
            {
              reason: "rejected",
              queue: queueName,
              time: new Date(),
              originalMessage: originalMessage,
            },
          ],
        },
      });

      if (sent) {
        console.log(`✅ [DLQ] Message sent to ${dlqName}`, {
          messageId: dlqMessage.originalMessage.notifId,
          dlqName,
        });

        // Kiểm tra ngay lập tức xem message có trong DLQ không
        await this.verifyMessageInDLQ(dlqName, dlqMessage);
      } else {
        console.error(`❌ [DLQ] Failed to send to ${dlqName} - channel.sendToQueue returned false`);
      }

      return sent;
    } catch (dlqError) {
      console.error(`❌ [DLQ] Failed to send to DLQ:`, dlqError.message);
    }
  }

  static async verifyMessageInDLQ(dlqName, expectedMessage) {
    try {
      const { channel } = await rabbitMQ.createChannel(`verify_${dlqName}`, dlqName);

      // Get message nhưng không ACK
      const msg = await channel.get(dlqName, { noAck: false });

      if (msg) {
        const actualMessage = JSON.parse(msg.content.toString());
        console.log(`🔍 [DLQ-Verify] Message found in ${dlqName}:`, {
          expectedId: expectedMessage.originalMessage.notifId,
          actualId: actualMessage.originalMessage?.notifId,
          messageCount: 1,
        });

        // Nack để giữ message trong queue
        await channel.nack(msg, false, true);
        await channel.close();
        return true;
      } else {
        console.warn(`🔍 [DLQ-Verify] NO MESSAGE FOUND in ${dlqName} right after sending!`);
        await channel.close();
        return false;
      }
    } catch (error) {
      console.error(`🔍 [DLQ-Verify] Error verifying DLQ:`, error.message);
      return false;
    }
  }

  static async setupDLQConsumer(queueName) {
    const dlqName = `${queueName}.dlq`;
    const { channel } = await rabbitMQ.createChannel(`dlq_consumer_${queueName}`, dlqName);

    channel.consume(
      dlqName,
      async (msg) => {
        if (!msg) return;

        try {
          const dlqMessage = JSON.parse(msg.content.toString());
          console.log(`📋 [DLQ-Consumer] DLQ Message details:`, {
            originalMessageId: dlqMessage.originalMessage?.notifId,
            error: dlqMessage.error,
            failedAt: dlqMessage.failedAt,
            queue: dlqMessage.queue,
          });

          // Here you can add custom DLQ processing logic
          // Like sending alerts, logging to monitoring system, etc.
          console.log(`✅ [DLQ-Consumer] ACKing message from ${dlqName}`);
          channel.ack(msg);
        } catch (error) {
          console.error(`❌ [DLQ] Failed to process DLQ message:`, error.message);
          channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
  }
}
