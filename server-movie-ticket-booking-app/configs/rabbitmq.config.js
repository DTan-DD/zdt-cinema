// "use strict";
// import dotenv from "dotenv";
// dotenv.config();
// import amqp from "amqplib";

// let connection = null;
// const channels = {}; // Lưu các channel (VD: payment, noti)

// const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

// /**
//  * 🔹 Hàm khởi tạo connection và channel
//  */
// export const initRabbitMQ = async () => {
//   if (connection) {
//     console.log("❌ [RabbitMQ] Connection already exists");
//     return;
//   }

//   try {
//     console.log("[RabbitMQ] Connecting...");
//     connection = await amqp.connect(RABBITMQ_URL, {
//       // ✅ bắt buộc với amqps để tránh lỗi SSL
//       heartbeat: 30,
//       rejectUnauthorized: false,
//     });

//     // Nếu connection bị close → auto reconnect
//     connection.on("close", async (err) => {
//       console.error("[RabbitMQ] Connection closed, retrying...", err?.message);
//       connection = null;
//       setTimeout(initRabbitMQ, 5000); // thử lại sau 5s
//     });

//     connection.on("error", (err) => {
//       console.error("[RabbitMQ] Connection error:", err?.message);
//     });

//     // Khởi tạo các queue mặc định
//     await Promise.all([
//       createChannel("payment", "payment_queue"), //
//       createChannel("mail", "mail_queue"),
//       createChannel("noti", "noti_queue"),
//     ]);
//     console.log("[RabbitMQ] Channels created:", Object.keys(channels)); // ✅ Debug
//     console.log("[RabbitMQ] Connected & Channels ready ✅");
//     // Thêm vào initRabbitMQ
//     return connection;
//   } catch (error) {
//     console.error("[RabbitMQ] Connection failed:", error.message);
//     setTimeout(initRabbitMQ, 5000); // thử lại sau 5s
//   }
// };

// /**
//  * 🔹 Tạo channel và queue tương ứng
//  * @param {string} name  - tên logic (VD: 'payment')
//  * @param {string} queue - tên queue trong broker (VD: 'payment_queue')
//  */
// export const createChannel = async (name, queue) => {
//   if (!connection) throw new Error("[RabbitMQ] No connection available");

//   try {
//     const channel = await connection.createChannel();
//     await channel.assertQueue(queue, { durable: true });

//     channels[name] = { channel, queue };
//     console.log(`✅ [RabbitMQ] Channel created: ${name} → ${queue}`);
//     return { channel, queue };
//   } catch (error) {
//     console.error(`❌ [RabbitMQ] Failed to create channel "${name}":`, error.message);
//     throw error;
//   }
// };

// /**
//  * 🔹 Lấy channel đã tạo theo tên
//  * @param {string} name
//  * @returns {{ channel, queue }}
//  */
// export const getChannel = (name) => {
//   const ch = channels[name];

//   if (!ch) {
//     console.error(`[RabbitMQ] Available channels:`, Object.keys(channels));
//     throw new Error(`[RabbitMQ] Channel "${name}" not found`);
//   }
//   return ch;
// };

// /**
//  * 🔹 Đóng kết nối (optional, khi shutdown app)
//  */
// export const closeRabbitMQ = async () => {
//   try {
//     if (connection) {
//       await connection.close();
//       console.log("[RabbitMQ] Connection closed gracefully");
//     }
//   } catch (err) {
//     console.error("[RabbitMQ] Close error:", err.message);
//   }
// };

"use strict";
import dotenv from "dotenv";
dotenv.config();
import amqp from "amqplib";

let connection = null;
const channels = {}; // cache channel theo tên logic (vd: noti, mail,...)
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

const RECONNECT_DELAY = 5000; // 5s
const MAX_RETRIES = 10;
let reconnectAttempts = 0;

/**
 * 🔹 Khởi tạo connection RabbitMQ (và auto reconnect nếu lỗi)
 */
export const initRabbitMQ = async () => {
  if (connection) {
    console.log("⚠️ [RabbitMQ] Connection already exists");
    return connection;
  }

  try {
    console.log("📡 [RabbitMQ] Connecting...");
    connection = await amqp.connect(RABBITMQ_URL, {
      heartbeat: 30,
      rejectUnauthorized: false,
    });

    console.log("✅ [RabbitMQ] Connected");

    connection.on("error", (err) => {
      console.error("❌ [RabbitMQ] Connection error:", err.message);
    });

    connection.on("close", () => {
      console.warn("⚠️ [RabbitMQ] Connection closed. Clearing channels...");
      connection = null;
      Object.keys(channels).forEach((k) => delete channels[k]);
      reconnectAttempts++;
      if (reconnectAttempts <= MAX_RETRIES) {
        setTimeout(initRabbitMQ, RECONNECT_DELAY);
      } else {
        console.error("🚨 [RabbitMQ] Too many reconnect attempts. Giving up.");
      }
    });

    reconnectAttempts = 0;
    return connection;
  } catch (error) {
    console.error("❌ [RabbitMQ] Connection failed:", error.message);
    reconnectAttempts++;
    if (reconnectAttempts <= MAX_RETRIES) {
      setTimeout(initRabbitMQ, RECONNECT_DELAY);
    }
  }
};

/**
 * 🔹 Tạo channel + queue + DLQ tương ứng
 */
export const createChannel = async (name, queueName) => {
  if (!connection) throw new Error("[RabbitMQ] No connection available");

  try {
    const channel = await connection.createChannel();

    // DLQ name (Dead Letter Queue)
    const dlqName = `${queueName}.dlq`;

    // Main queue + DLQ
    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": dlqName,
      },
    });

    await channel.assertQueue(dlqName, { durable: true });

    await channel.prefetch(1); // xử lý từng message một

    // Event cho channel
    channel.on("error", (err) => {
      console.error(`❌ [RabbitMQ] Channel "${name}" error:`, err.message);
    });
    channel.on("close", () => {
      console.warn(`⚠️ [RabbitMQ] Channel "${name}" closed`);
      delete channels[name];
    });

    channels[name] = { channel, queue: queueName };
    console.log(`✅ [RabbitMQ] Channel ready: ${name} → ${queueName}`);
    return { channel, queue: queueName };
  } catch (error) {
    console.error(`❌ [RabbitMQ] Failed to create channel "${name}":`, error.message);
    throw error;
  }
};

/**
 * 🔹 Lấy channel theo tên
 */
export const getChannel = (name) => {
  const ch = channels[name];
  if (!ch) {
    console.error("[RabbitMQ] Available channels:", Object.keys(channels));
    throw new Error(`[RabbitMQ] Channel "${name}" not found`);
  }
  return ch;
};

/**
 * 🔹 Publish message
 */
export const publishToQueue = async (queueName, message) => {
  const { channel, queue } = getChannel(queueName);
  const payload = Buffer.from(JSON.stringify(message));

  const sent = channel.sendToQueue(queue, payload, { persistent: true });
  if (sent) {
    console.log(`📤 [RabbitMQ] Sent → ${queue}`, message);
  } else {
    console.warn(`⚠️ [RabbitMQ] Failed to send → ${queue}`);
  }
};

/**
 * 🔹 Consume queue (worker)
 */
export const consumeQueue = async (queueName, handler) => {
  const { channel, queue } = getChannel(queueName);

  await channel.consume(
    queue,
    async (msg) => {
      if (!msg) return;
      try {
        await handler(msg, channel);
        channel.ack(msg);
      } catch (err) {
        console.error(`❌ [RabbitMQ] Error in handler for queue "${queue}":`, err.message);
        channel.nack(msg, false, false); // gửi sang DLQ
      }
    },
    { noAck: false }
  );

  console.log(`👂 [RabbitMQ] Listening on queue: ${queue}`);
};

/**
 * 🔹 Đóng connection (graceful shutdown)
 */
export const closeRabbitMQ = async () => {
  try {
    if (connection) {
      await connection.close();
      console.log("[RabbitMQ] Connection closed gracefully 📴");
    }
  } catch (err) {
    console.error("[RabbitMQ] Close error:", err.message);
  }
};
