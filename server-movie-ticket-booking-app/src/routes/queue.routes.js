import express from "express";
import { paymentQueue } from "../services/queues/paymentQueue.service.js";

const router = express.Router();

// GET /v1/api/queue/status
router.get("/status", async (req, res) => {
  try {
    const counts = await paymentQueue.getJobCounts();
    // { waiting, active, completed, failed, delayed, paused }

    const jobs = await paymentQueue.getJobs(
      ["waiting", "active", "completed", "failed"],
      0,
      10 // lấy tối đa 10 job gần nhất mỗi trạng thái
    );

    res.json({
      counts,
      sampleJobs: jobs.map((job) => ({
        id: job.id,
        name: job.name,
        state: job.state,
        data: job.data,
        returnValue: job.returnvalue,
        failedReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      })),
    });
  } catch (err) {
    console.error("❌ Queue status error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
