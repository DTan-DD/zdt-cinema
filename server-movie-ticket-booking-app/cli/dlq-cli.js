#!/usr/bin/env node

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
// Import sau khi đã load .env
import { rabbitMQ } from "../configs/rabbitmqV2.config.js";
import { DLQRetryHandler } from "../src/services/workers/dlqRetry.service.js";

const command = process.argv[2];
const dlqName = process.argv[3] || "payment_queue.dlq";
const count = parseInt(process.argv[4]) || 10;

async function initConnection() {
  try {
    console.log("🔗 Initializing RabbitMQ connection...");
    await rabbitMQ.init();
    console.log("✅ RabbitMQ connected");
    console.log("📊 RabbitMQ status:", rabbitMQ.getStatus());
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error);
    process.exit(1);
  }
}

async function closeConnection() {
  try {
    // 🔥 FIX 2: Đợi một chút trước khi đóng để đảm bảo operations hoàn thành
    await new Promise((resolve) => setTimeout(resolve, 500));
    await rabbitMQ.close();
    console.log("🔌 RabbitMQ connection closed");
  } catch (error) {
    console.error("❌ Error closing connection:", error.message);
  }
}

async function main() {
  try {
    // Khởi tạo connection trước
    await initConnection();

    switch (command) {
      case "inspect":
        console.log(`🔍 [CLI] Inspecting queue: ${dlqName}`);
        const messages = await DLQRetryHandler.inspectDLQ(dlqName, parseInt(count));
        console.log(`📋 Found ${messages.length} messages in ${dlqName}:`);
        break;

      case "retry":
        const retriedCount = await DLQRetryHandler.retryMessage(dlqName, count);
        console.log(`✅ Retried ${retriedCount} messages from ${dlqName}`);
        break;

      case "auto-retry":
        const results = await DLQRetryHandler.autoRetryWithBackoff(dlqName, count);
        console.log("📊 Auto-retry results:", results);
        break;

      case "purge":
        const purgedCount = await DLQRetryHandler.purgeDLQ(dlqName);
        console.log(`🧹 Purged ${purgedCount} messages from ${dlqName}`);
        break;

      case "status":
        const statusMessages = await DLQRetryHandler.inspectDLQ(dlqName, 1);
        console.log(`📊 ${dlqName}: ${statusMessages.length > 0 ? "HAS MESSAGES" : "EMPTY"}`);
        break;

      case "all-queues":
        await listAllQueues();
        break;

      case "queue-detail":
        // Gọi API thay vì trực tiếp
        const apiResult = await fetch(`http://localhost:${process.env.PORT}/api/admin/dlq/queues/${dlqName}`);
        const data = await apiResult.json();
        console.log("📋 Queues from API:", JSON.stringify(data, null, 2));
        break;

      case "stats":
        // Gọi API thay vì trực tiếp
        const statsResult = await fetch(`http://localhost:${process.env.PORT}/api/admin/dlq/stats`);
        const statsData = await statsResult.json();
        console.log("📊 Stats from API:", JSON.stringify(statsData, null, 2));
        break;

      default:
        showHelp();
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    // 🔥 FIX 3: Đóng connection đúng cách
    await closeConnection();
    // Force exit để không bị hang
    await new Promise((r) => setTimeout(r, 1500));
    process.exit(0);
  }
}

async function listAllQueues() {
  try {
    const status = rabbitMQ.getStatus();
    console.log("📊 RabbitMQ Status:");
    console.log("- Connected:", status.isConnected);
    console.log("- Channels:", status.channels.join(", "));
    console.log("- Reconnect attempts:", status.reconnectAttempts);

    // List các queues có thể có
    const possibleQueues = ["payment_queue", "payment_queue.dlq", "mail_queue", "mail_queue.dlq", "noti_queue", "noti_queue.dlq"];

    console.log("\n🔍 Checking queues:");
    for (const queue of possibleQueues) {
      try {
        const timestamp = Date.now();
        const { channel } = await rabbitMQ.createChannel(`check_${queue}_${timestamp}`, queue);
        const queueInfo = await channel.checkQueue(queue);
        console.log(`✅ ${queue}: ${queueInfo.messageCount} messages`);
        await channel.close();
      } catch (error) {
        console.log(`❌ ${queue}: Not exists or error (${error.message})`);
      }
    }
  } catch (error) {
    console.error("❌ Error listing queues:", error.message);
  }
}

function showHelp() {
  console.log(`
🐰 RabbitMQ DLQ Management CLI

Usage: node dlq-cli.js <command> [dlqName] [count]

Commands:
  inspect [dlqName] [limit]    - Xem messages trong DLQ
  retry [dlqName] [count]      - Retry messages từ DLQ
  auto-retry [dlqName] [max]   - Retry tự động với max retries  
  purge [dlqName]              - Xóa toàn bộ DLQ
  status [dlqName]             - Check trạng thái DLQ
  queues                       - List tất cả queues

Examples:
  node dlq-cli.js inspect noti_queue.dlq 5
  node dlq-cli.js retry mail_queue.dlq 3
  node dlq-cli.js auto-retry payment_queue.dlq 5
  node dlq-cli.js all-queues
  node dlq-cli.js queue-detail payment_queue
  node dlq-cli.js stats
  `);
}

// Xử lý Ctrl+C
process.on("SIGINT", async () => {
  console.log("\n🛑 Received Ctrl+C, shutting down...");
  await closeConnection();
  process.exit(0);
});

// Xử lý uncaught errors
process.on("uncaughtException", async (error) => {
  console.error("💥 Uncaught Exception:", error);
  await closeConnection();
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  await closeConnection();
  process.exit(1);
});

main().catch((error) => console.error("❌ Error:", error.message));
