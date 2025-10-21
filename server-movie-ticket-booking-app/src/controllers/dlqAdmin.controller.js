import { rabbitMQ } from "../../configs/rabbitmqV2.config.js";
import { DLQRetryHandler } from "../services/workers/dlqRetry.service.js";

export class DLQAdminController {
  static async inspectDLQ(req, res) {
    try {
      const { dlqName = "payment_queue.dlq", limit = 20 } = req.query;
      const messages = await DLQRetryHandler.inspectDLQ(dlqName, parseInt(limit));
      console.log(`📊 [API] Found ${messages.length} messages in ${dlqName}:`);
      res.json({
        success: true,
        dlqName,
        messageCount: messages.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async retryMessages(req, res) {
    try {
      const { dlqName = "payment_queue.dlq", count = 1 } = req.body;
      const retriedCount = await DLQRetryHandler.retryMessage(dlqName, parseInt(count));

      res.json({
        success: true,
        dlqName,
        retriedCount,
        message: `Retried ${retriedCount} messages from ${dlqName}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async autoRetry(req, res) {
    try {
      const { dlqName = "payment_queue.dlq", maxRetries = 3 } = req.body;
      const results = await DLQRetryHandler.autoRetryWithBackoff(dlqName, parseInt(maxRetries));

      res.json({
        success: true,
        dlqName,
        results,
        message: `Auto-retry completed for ${dlqName}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async purgeDLQ(req, res) {
    try {
      const { dlqName = "payment_queue.dlq" } = req.body;
      const purgedCount = await DLQRetryHandler.purgeDLQ(dlqName);

      res.json({
        success: true,
        dlqName,
        purgedCount,
        message: `Purged ${purgedCount} messages from ${dlqName}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  static async getDLQStatus(req, res) {
    try {
      const dlqNames = ["payment_queue.dlq", "mail_queue.dlq", "noti_queue.dlq"];

      const status = {};

      for (const dlqName of dlqNames) {
        try {
          const messages = await DLQRetryHandler.inspectDLQ(dlqName, 1);
          status[dlqName] = {
            hasMessages: messages.length > 0,
            // sampleMessage: messages[0] || null,
          };
        } catch (error) {
          status[dlqName] = {
            error: error.message,
          };
        }
      }

      res.json({
        success: true,
        status,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/admin/dlq/queues - List tất cả queues
   */
  static async listAllQueues(req, res) {
    try {
      console.log(`📋 [API] Listing all queues...`);

      const result = await DLQRetryHandler.listAllQueues();

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error(`❌ [API] Failed to list queues:`, error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/admin/dlq/queues/:queueName - Chi tiết một queue
   */
  static async getQueueDetail(req, res) {
    try {
      const { queueName } = req.params;
      console.log(`📋 [API] Getting detail for queue: ${queueName}`);

      const detail = await DLQRetryHandler.getQueueDetail(queueName);

      res.json({
        success: true,
        queue: detail,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`❌ [API] Failed to get queue detail:`, error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /api/admin/dlq/stats - Thống kê tổng quan
   */
  static async getQueueStats(req, res) {
    try {
      console.log(`📊 [API] Getting queue statistics...`);

      const result = await DLQRetryHandler.listAllQueues();

      // Phân tích chi tiết hơn
      const stats = {
        summary: result.summary,
        byType: {
          main: result.queues.filter((q) => q.type === "MAIN"),
          dlq: result.queues.filter((q) => q.type === "DLQ"),
        },
        problematicQueues: result.queues.filter((q) => q.type === "DLQ" && q.status === "EXISTS" && q.messageCount > 0),
        healthyQueues: result.queues.filter((q) => q.status === "EXISTS" && (q.type === "MAIN" || q.messageCount === 0)),
      };

      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`❌ [API] Failed to get queue stats:`, error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
