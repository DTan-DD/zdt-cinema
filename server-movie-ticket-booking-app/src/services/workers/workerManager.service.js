import { PaymentWorker } from "./paymentWorker.service.js";
import { MailWorker } from "./mailWorker.service.js";
import { NotificationWorker } from "./notificationWorkerV2.service.js";
import { DLQHandler } from "./dlqHandler.service.js";
import { rabbitMQ } from "../../../configs/rabbitmqV2.config.js";

export class WorkerManager {
  constructor() {
    this.workers = new Map();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      console.log("⚠️ WorkerManager already running");
      return;
    }

    try {
      // Initialize RabbitMQ connection first
      await rabbitMQ.init();

      // Initialize workers
      const workerConfigs = [
        { name: "payment", worker: new PaymentWorker() },
        { name: "mail", worker: new MailWorker() },
        { name: "notification", worker: new NotificationWorker() },
      ];

      // Start all workers
      for (const { name, worker } of workerConfigs) {
        await worker.start();
        this.workers.set(name, worker);

        // Setup DLQ consumer for each worker
        // await DLQHandler.setupDLQConsumer(worker.queueName);
      }

      this.isRunning = true;
      console.log("🚀 All workers started successfully!");

      // Log status
      console.log("📊 RabbitMQ Status:", rabbitMQ.getStatus());
    } catch (error) {
      console.error("❌ Failed to start workers:", error);
      throw error;
    }
  }

  async stop() {
    for (const [name, worker] of this.workers) {
      await worker.stop();
    }

    this.workers.clear();
    this.isRunning = false;
    console.log("🛑 All workers stopped");
  }

  getWorkerStatus() {
    const status = {};
    for (const [name, worker] of this.workers) {
      status[name] = {
        isRunning: worker.isRunning,
        queueName: worker.queueName,
      };
    }
    return status;
  }
}

// Singleton instance
export const workerManager = new WorkerManager();

// Main startup function
export const startWorkers = () => workerManager.start();
