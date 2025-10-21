import express from "express";
import { DLQAdminController } from "../controllers/dlqAdmin.controller.js";

const router = express.Router();

// GET /api/admin/dlq/status - Check DLQ status
router.get("/status", DLQAdminController.getDLQStatus);

// GET /api/admin/dlq/inspect?dlqName=payment_queue.dlq&limit=10 - Xem messages trong DLQ
router.get("/inspect", DLQAdminController.inspectDLQ);

// POST /api/admin/dlq/retry - Retry messages từ DLQ
router.post("/retry", DLQAdminController.retryMessages);

// POST /api/admin/dlq/auto-retry - Retry tự động với backoff
router.post("/auto-retry", DLQAdminController.autoRetry);

// POST /api/admin/dlq/purge - Xóa toàn bộ DLQ
router.post("/purge", DLQAdminController.purgeDLQ);

// GET /api/admin/dlq/queues - List tất cả queues
router.get("/queues", DLQAdminController.listAllQueues);

// GET /api/admin/dlq/queues/:queueName - Chi tiết một queue
router.get("/queues/:queueName", DLQAdminController.getQueueDetail);

// GET /api/admin/dlq/stats - Thống kê tổng quan
router.get("/stats", DLQAdminController.getQueueStats);

export default router;
