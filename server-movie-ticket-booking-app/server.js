"use strict";
import express from "express";
import cors from "cors";
import "dotenv/config";
import dotenv from "dotenv";
import { db } from "./dbs/init.mongodb.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./src/inngest/index.js";
import showRouter from "./src/routes/showRoutes.js";
import bookingRouter from "./src/routes/bookingRoutes.js";
import adminRouter from "./src/routes/adminRoutes.js";
import userRouter from "./src/routes/userRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import cinemaRouter from "./src/routes/cinemaRoutes.js";
import helmet from "helmet";
import compression from "compression";

const app = express();
const port = 3000;
dotenv.config();
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());
app.use(helmet());
app.use(compression());
// dbs
// connect MongoDB khi server start
(async () => {
  try {
    await db.connect();
    console.log("🚀 MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed", err);
    process.exit(1); // dừng app nếu connect fail
  }
})();
// console.log("MongoDB instance:", db);

// Middleware

// API Routes
app.get("/", (req, res) => res.send("Server is Live"));
// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/v1/api/shows", showRouter);
app.use("/v1/api/bookings", bookingRouter);
app.use("/v1/api/admin", adminRouter);
app.use("/v1/api/users", userRouter);
app.use("/v1/api/cinemas", cinemaRouter);
// Mount payment routes
app.use("/v1/api/payment", paymentRoutes);

app.listen(port, () => console.log(`Server is on port ${port}`));
