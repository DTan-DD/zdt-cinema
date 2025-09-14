"use strict";

import mongoose from "mongoose";
import { countConnect } from "../helpers/check.connect.js";

const connectString = `${process.env.MONGOD_URI}/movie-ticket-booking-app`;

class Database {
  constructor() {
    this.connected = false;
  }

  async connect() {
    if (this.connected) return; // tránh reconnect nhiều lần

    try {
      if (process.env.NODE_ENV !== "production") {
        // mongoose.set("debug", { color: true });
        mongoose.set("debug", false);
      } else {
        mongoose.set("debug", false);
      }

      await mongoose.connect(connectString, {
        maxPoolSize: 50,
        serverSelectionTimeoutMS: 10000, // fail nhanh nếu không connect được
      });

      this.connected = true;
      console.log(`✅ Connected mongodb success`, countConnect());
    } catch (err) {
      console.error("❌ MongoDB connection error:", err);
      throw err;
    }
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

export const db = Database.getInstance();
