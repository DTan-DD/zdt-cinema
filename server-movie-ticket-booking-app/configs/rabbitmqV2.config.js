"use strict";
import dotenv from "dotenv";
dotenv.config();

import amqp from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL;

class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channels = new Map();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  async init() {
    if (this.connection || this.isConnecting) {
      return this.connection;
    }

    this.isConnecting = true;

    try {
      console.log("[RabbitMQ] Connecting...");
      this.connection = await amqp.connect(RABBITMQ_URL, {
        heartbeat: 30,
        rejectUnauthorized: false,
      });

      this.setupEventHandlers();
      this.reconnectAttempts = 0;
      this.isConnecting = false;

      console.log("[RabbitMQ] Connected ✅");
      return this.connection;
    } catch (error) {
      this.isConnecting = false;
      console.error("[RabbitMQ] Connection failed:", error.message);
      await this.handleReconnect();
      throw error;
    }
  }

  setupEventHandlers() {
    this.connection.on("close", async (err) => {
      console.error("[RabbitMQ] Connection closed:", err?.message);
      this.connection = null;
      this.channels.clear();
      await this.handleReconnect();
    });

    this.connection.on("error", (err) => {
      console.error("[RabbitMQ] Connection error:", err?.message);
    });
  }

  async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[RabbitMQ] Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(5000 * this.reconnectAttempts, 30000); // Exponential backoff

    console.log(`[RabbitMQ] Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.init();
      } catch (error) {
        // Error already handled in init
      }
    }, delay);
  }

  async createChannel(name, queueName, options = { durable: true }) {
    if (!this.connection) {
      throw new Error("[RabbitMQ] No connection available");
    }

    if (this.channels.has(name)) {
      return this.channels.get(name);
    }

    try {
      const channel = await this.connection.createChannel();
      await channel.assertQueue(queueName, options);

      const channelInfo = { channel, queue: queueName, name };
      this.channels.set(name, channelInfo);

      console.log(`✅ [RabbitMQ] Channel created: ${name} → ${queueName}`);
      return channelInfo;
    } catch (error) {
      console.error(`❌ [RabbitMQ] Failed to create channel "${name}":`, error.message);
      throw error;
    }
  }

  getChannel(name) {
    const channelInfo = this.channels.get(name);

    if (!channelInfo) {
      console.error(`[RabbitMQ] Available channels:`, Array.from(this.channels.keys()));
      throw new Error(`[RabbitMQ] Channel "${name}" not found`);
    }

    return channelInfo;
  }

  async close() {
    try {
      // Close all channels
      for (const [name, { channel }] of this.channels) {
        await channel.close();
        console.log(`[RabbitMQ] Channel ${name} closed`);
      }

      this.channels.clear();

      if (this.connection) {
        await this.connection.close();
        console.log("[RabbitMQ] Connection closed gracefully");
      }
    } catch (err) {
      console.error("[RabbitMQ] Close error:", err.message);
    }
  }

  getStatus() {
    return {
      isConnected: !!this.connection,
      channelCount: this.channels.size,
      channels: Array.from(this.channels.keys()),
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Singleton instance
export const rabbitMQ = new RabbitMQConnection();

// Legacy export for backward compatibility
export const initRabbitMQ = () => rabbitMQ.init();
export const createChannel = (name, queue) => rabbitMQ.createChannel(name, queue);
export const getChannel = (name) => rabbitMQ.getChannel(name);
export const closeRabbitMQ = () => rabbitMQ.close();
