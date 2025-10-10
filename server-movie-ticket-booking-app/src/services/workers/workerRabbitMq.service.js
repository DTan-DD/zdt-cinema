import { initRabbitMQ } from "../../../configs/rabbitmq.config.js";
import { startUpdateBookingWorker } from "./updateBookingWorkerRabbitMq.service.js";
import { startSendMailWorker } from "./sendMailWorkerRabbitMq.service.js";
import { startNotificationWorker } from "./notificationWorkerRabbitMq.service.js";

const startWorkers = async () => {
  await initRabbitMQ(); // ✅ Tạo connection + channel trước

  await startUpdateBookingWorker();
  await startSendMailWorker();
  await startNotificationWorker();

  console.log("🚀 Workers started!");
};

startWorkers().catch((err) => {
  console.error("❌ Failed to start workers:", err);
});
