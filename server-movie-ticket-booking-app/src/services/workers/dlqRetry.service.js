import { rabbitMQ } from "../../../configs/rabbitmqV2.config.js";
import { QueueService } from "../queues/queueRabbitMqV2.service.js";

export class DLQRetryHandler {
  static async ensureConnection() {
    if (!rabbitMQ.connection) {
      await rabbitMQ.init();
    }
  }

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
    let channel;
    try {
      const { channel: ch } = await rabbitMQ.createChannel(`verify_${dlqName}`, dlqName);
      channel = ch;

      // Kiểm tra queue tồn tại
      await channel.checkQueue(dlqName).catch(() => {
        throw new Error(`Queue ${dlqName} does not exist`);
      });

      // Get message nhưng không ACK
      const msg = await channel.get(dlqName, { noAck: false });

      if (!msg) {
        console.warn(`🔍 [DLQ-Verify] No message found in ${dlqName}.`);
        return false;
      }

      const actualMessage = JSON.parse(msg.content.toString());
      console.log(`🔍 [DLQ-Verify] Message found in ${dlqName}:`, {
        expectedId: expectedMessage.originalMessage.notifId,
        actualId: actualMessage.originalMessage?.notifId,
      });

      // Nack để giữ lại message
      await channel.nack(msg, false, true);

      // Đợi một chút để đảm bảo nack gửi xong
      await new Promise((r) => setTimeout(r, 100));

      return true;
    } catch (error) {
      console.error(`🔍 [DLQ-Verify] Error verifying DLQ:`, error.message);
      return false;
    } finally {
      if (channel) {
        try {
          await channel.close();
        } catch (e) {
          console.warn(`[DLQ-Verify] Channel already closed.`);
        }
      }
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

  /**
   * Retry message từ DLQ về queue chính
   */
  static async retryMessage(dlqName, messageCount = 1) {
    try {
      const originalQueue = dlqName.replace(".dlq", "");
      const { channel: dlqChannel } = await rabbitMQ.createChannel(`dlq_retry_${dlqName}`, dlqName);
      const { channel: mainChannel } = await rabbitMQ.createChannel(`main_retry_${originalQueue}`, originalQueue);

      let retriedCount = 0;

      while (retriedCount < messageCount) {
        const msg = await dlqChannel.get(dlqName, { noAck: false });

        if (!msg) break;

        try {
          const dlqPayload = JSON.parse(msg.content.toString());
          const originalMessage = dlqPayload.originalMessage;

          // Gửi lại message gốc về queue chính
          const sent = mainChannel.sendToQueue(originalQueue, Buffer.from(JSON.stringify(originalMessage)), { persistent: true });

          if (sent) {
            await dlqChannel.ack(msg);
            retriedCount++;
            console.log(`✅ [DLQRetry] Retried message from ${dlqName} to ${originalQueue}`);
          } else {
            await dlqChannel.nack(msg, false, true); // Requeue lại DLQ
            console.warn(`⚠️ [DLQRetry] Failed to retry message from ${dlqName}`);
            break;
          }
        } catch (error) {
          await dlqChannel.nack(msg, false, false); // Bỏ message lỗi
          console.error(`❌ [DLQRetry] Error processing DLQ message:`, error.message);
        }
      }

      console.log(`📊 [DLQRetry] Retried ${retriedCount} messages from ${dlqName}`);
      return retriedCount;
    } catch (error) {
      console.error(`❌ [DLQRetry] Failed to retry from ${dlqName}:`, error.message);
      throw error;
    }
  }

  /**
   * Xem danh sách messages trong DLQ (không xóa)
   */
  static async inspectDLQ(dlqName, limit = 10) {
    console.log("kk");
    console.log(`📊 [DLQRetry] Inspecting DLQ ${dlqName}`);
    try {
      const { channel } = await rabbitMQ.createChannel(`dlq_inspect_${dlqName}`, dlqName);

      // Kiểm tra queue info trước
      console.log(`[DEBUG] Using channel for DLQ: ${dlqName}`);
      const queueInfo = await channel.checkQueue(dlqName);
      console.log(`[DEBUG] Queue ${dlqName} has ${queueInfo.messageCount} messages before get()`);

      const messages = [];
      const actualLimit = Math.min(limit, queueInfo.messageCount);

      for (let i = 0; i < actualLimit; i++) {
        // 🔥 Dùng noAck: true để không cần nack (nhưng message sẽ mất)
        // HOẶC phải nack nếu dùng noAck: false
        const msg = await channel.get(dlqName, { noAck: false });
        if (!msg) {
          console.log(`📊 [DLQRetry] No more messages in DLQ ${dlqName} to inspect`);
          break;
        }

        try {
          messages.push({
            content: JSON.parse(msg.content.toString()),
            properties: msg.properties,
            fields: msg.fields,
          });

          // Nack ngay để message quay lại queue
          await channel.nack(msg, false, true);
        } catch (error) {
          messages.push({
            error: error.message,
            rawContent: msg.content.toString(),
          });
          await channel.nack(msg, false, true);
        }
      }

      return messages;
    } catch (error) {
      console.error(`❌ [DLQRetry] Failed to inspect DLQ ${dlqName}:`, error.message);
      throw error;
    }
  }
  /**
   * Xóa message khỏi DLQ
   */
  static async purgeDLQ(dlqName) {
    try {
      const { channel } = await rabbitMQ.createChannel(`dlq_purge_${dlqName}`, dlqName);
      const purgeResult = await channel.purgeQueue(dlqName);

      console.log(`🧹 [DLQRetry] Purged ${purgeResult.messageCount} messages from ${dlqName}`);
      return purgeResult.messageCount;
    } catch (error) {
      console.error(`❌ [DLQRetry] Failed to purge DLQ ${dlqName}:`, error.message);
      throw error;
    }
  }

  /**
   * Retry tự động với số lần thử
   */
  static async autoRetryWithBackoff(dlqName, maxRetries = 3) {
    const messages = await this.inspectDLQ(dlqName, 50);
    const results = {
      successful: 0,
      failed: 0,
      skipped: 0,
    };

    for (const msgInfo of messages) {
      if (msgInfo.error) {
        results.skipped++;
        continue;
      }

      const retryCount = msgInfo.properties.headers?.["x-retry-count"] || 0;

      if (retryCount >= maxRetries) {
        console.log(`⏭️ [DLQRetry] Skip message exceeded max retries (${retryCount})`);
        results.skipped++;
        continue;
      }

      try {
        await this.retryMessage(dlqName, 1);
        results.successful++;

        // Delay giữa các lần retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.failed++;
        console.error(`❌ [DLQRetry] Auto-retry failed:`, error.message);
      }
    }

    return results;
  }

  /**
   * List tất cả queues và thông tin chi tiết
   */
  static async listAllQueues() {
    await this.ensureConnection();

    console.log(`📋 [DLQRetry] Listing all queues...`);

    const possibleQueues = ["payment_queue", "payment_queue.dlq", "mail_queue", "mail_queue.dlq", "noti_queue", "noti_queue.dlq"];

    const queueDetails = [];
    const errors = [];

    for (const queueName of possibleQueues) {
      try {
        // Tạo channel tạm để check queue
        const timestamp = Date.now();
        const { channel } = await rabbitMQ.createChannel(`list_${queueName}_${timestamp}`, queueName);

        const queueInfo = await channel.checkQueue(queueName);

        queueDetails.push({
          name: queueName,
          messageCount: queueInfo.messageCount,
          consumerCount: queueInfo.consumerCount,
          type: queueName.includes(".dlq") ? "DLQ" : "MAIN",
          status: "EXISTS",
        });

        await channel.close();
      } catch (error) {
        if (error.message.includes("NOT_FOUND")) {
          queueDetails.push({
            name: queueName,
            messageCount: 0,
            consumerCount: 0,
            type: queueName.includes(".dlq") ? "DLQ" : "MAIN",
            status: "NOT_EXISTS",
          });
        } else {
          errors.push({
            queue: queueName,
            error: error.message,
          });
          console.error(`❌ [DLQRetry] Error checking queue ${queueName}:`, error.message);
        }
      }
    }

    // Tính tổng số messages
    const totalMessages = queueDetails.reduce((sum, q) => sum + q.messageCount, 0);
    const existingQueues = queueDetails.filter((q) => q.status === "EXISTS");
    const dlqMessages = queueDetails.filter((q) => q.type === "DLQ" && q.status === "EXISTS").reduce((sum, q) => sum + q.messageCount, 0);

    return {
      success: true,
      summary: {
        totalQueues: possibleQueues.length,
        existingQueues: existingQueues.length,
        totalMessages,
        dlqMessages,
        errors: errors.length,
      },
      queues: queueDetails,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get chi tiết một queue cụ thể
   */
  static async getQueueDetail(queueName) {
    await this.ensureConnection();

    try {
      const timestamp = Date.now();
      const { channel } = await rabbitMQ.createChannel(`detail_${queueName}_${timestamp}`, queueName);

      const queueInfo = await channel.checkQueue(queueName);

      const detail = {
        name: queueName,
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount,
        type: queueName.includes(".dlq") ? "DLQ" : "MAIN",
        status: "EXISTS",
        // details: queueInfo,
      };

      await channel.close();
      return detail;
    } catch (error) {
      if (error.message.includes("NOT_FOUND")) {
        return {
          name: queueName,
          messageCount: 0,
          consumerCount: 0,
          type: queueName.includes(".dlq") ? "DLQ" : "MAIN",
          status: "NOT_EXISTS",
          error: "Queue does not exist",
        };
      }
      throw error;
    }
  }
}
