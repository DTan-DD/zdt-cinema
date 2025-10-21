#!/usr/bin/env node

import { rabbitMQ } from "../configs/rabbitmqV2.config";

const dlqName = process.argv[2] || "noti_queue.dlq";

async function monitorDLQ() {
  await rabbitMQ.init();

  const { channel } = await rabbitMQ.createChannel(`monitor_${dlqName}`, dlqName);

  console.log(`🎯 Monitoring DLQ: ${dlqName}`);
  console.log("Press Ctrl+C to stop monitoring\n");

  // Kiểm tra message count hiện tại
  const queueInfo = await channel.checkQueue(dlqName);
  console.log(`📊 Current message count: ${queueInfo.messageCount}`);

  if (queueInfo.messageCount === 0) {
    console.log("🔍 No messages in DLQ. Waiting for new messages...");
  }

  // Consume messages real-time
  channel.consume(
    dlqName,
    (msg) => {
      if (msg) {
        console.log("\n=== 📨 NEW DLQ MESSAGE ===");
        console.log("Properties:", msg.properties);

        try {
          const content = JSON.parse(msg.content.toString());
          console.log("Content:", JSON.stringify(content, null, 2));
        } catch (e) {
          console.log("Raw Content:", msg.content.toString());
        }

        console.log("=== END MESSAGE ===\n");

        // KHÔNG ACK - để message vẫn trong queue
        channel.nack(msg, false, true);
      }
    },
    { noAck: false }
  );

  // Keep alive
  process.on("SIGINT", async () => {
    console.log("\n🛑 Stopping monitor...");
    await channel.close();
    await rabbitMQ.close();
    process.exit(0);
  });
}

monitorDLQ().catch(console.error);
