import dotenv from "dotenv";
dotenv.config();

// import { closeRabbitMQ } from "./configs/rabbitmq.config.js";
import { initSocket } from "./socket.js";
import app from "./src/app.js";
import http from "http";
import { closeRabbitMQ } from "./configs/rabbitmqV2.config.js";
import { workerManager } from "./src/services/workers/workerManager.service.js";

const PORT = process.env.PORT || 8000;

// Khởi tạo Socket.IO
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log("connected with port:", PORT);
});

process.on("SIGINT", async () => {
  await workerManager.stop();
  await closeRabbitMQ();
  server.close(() => console.log("disconnected with port:", PORT));
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await workerManager.stop();
  await closeRabbitMQ();
  server.close(() => console.log("disconnected with port:", PORT));
  process.exit(0);
});
