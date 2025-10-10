"use strict";
import dotenv from "dotenv";
dotenv.config();
import amqp from "amqplib";

let connection = null;
const channels = {}; // Lưu các channel (VD: payment, noti)

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

/**
 * 🔹 Hàm khởi tạo connection và channel
 */
export const initRabbitMQ = async () => {
  if (connection) {
    console.log("❌ [RabbitMQ] Connection already exists");
    return;
  }

  try {
    console.log("[RabbitMQ] Connecting...");
    connection = await amqp.connect(RABBITMQ_URL, {
      // ✅ bắt buộc với amqps để tránh lỗi SSL
      heartbeat: 30,
      rejectUnauthorized: false,
    });

    // Nếu connection bị close → auto reconnect
    connection.on("close", async (err) => {
      console.error("[RabbitMQ] Connection closed, retrying...", err?.message);
      connection = null;
      setTimeout(initRabbitMQ, 5000); // thử lại sau 5s
    });

    connection.on("error", (err) => {
      console.error("[RabbitMQ] Connection error:", err?.message);
    });

    // Khởi tạo các queue mặc định
    await Promise.all([
      createChannel("payment", "payment_queue"), //
      createChannel("mail", "mail_queue"),
      createChannel("noti", "noti_queue"),
    ]);
    console.log("[RabbitMQ] Channels created:", Object.keys(channels)); // ✅ Debug
    console.log("[RabbitMQ] Connected & Channels ready ✅");
    // Thêm vào initRabbitMQ
    return connection;
  } catch (error) {
    console.error("[RabbitMQ] Connection failed:", error.message);
    setTimeout(initRabbitMQ, 5000); // thử lại sau 5s
  }
};

/**
 * 🔹 Tạo channel và queue tương ứng
 * @param {string} name  - tên logic (VD: 'payment')
 * @param {string} queue - tên queue trong broker (VD: 'payment_queue')
 */
export const createChannel = async (name, queue) => {
  if (!connection) throw new Error("[RabbitMQ] No connection available");

  try {
    const channel = await connection.createChannel();
    await channel.assertQueue(queue, { durable: true });

    channels[name] = { channel, queue };
    console.log(`✅ [RabbitMQ] Channel created: ${name} → ${queue}`);
    return { channel, queue };
  } catch (error) {
    console.error(`❌ [RabbitMQ] Failed to create channel "${name}":`, error.message);
    throw error;
  }
};

/**
 * 🔹 Lấy channel đã tạo theo tên
 * @param {string} name
 * @returns {{ channel, queue }}
 */
export const getChannel = (name) => {
  const ch = channels[name];

  if (!ch) {
    console.error(`[RabbitMQ] Available channels:`, Object.keys(channels));
    throw new Error(`[RabbitMQ] Channel "${name}" not found`);
  }
  return ch;
};

/**
 * 🔹 Đóng kết nối (optional, khi shutdown app)
 */
export const closeRabbitMQ = async () => {
  try {
    if (connection) {
      await connection.close();
      console.log("[RabbitMQ] Connection closed gracefully");
    }
  } catch (err) {
    console.error("[RabbitMQ] Close error:", err.message);
  }
};
