"use strict";
import express from "express";
import cors from "cors";
import "dotenv/config";
import dotenv from "dotenv";
import { db } from "../dbs/init.mongodb.js";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import showRouter from "./routes/show.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import adminRouter from "./routes/admin.routes.js";
import userRouter from "./routes/user.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import cinemaRouter from "./routes/cinema.routes.js";
import helmet from "helmet";
import compression from "compression";
import myLogger from "./loggers/mylogger.log.js";
import { NotFoundError } from "./core/error.response.js";
import { uuidv7 } from "uuidv7";
// import "./services/workers/updateBookingWorker.service.js";
// import "./services/reconciliation/index.js";
import queueDashboard from "./routes/queue.routes.js";
// import "./services/workers/sendEmailWorker.service.js";
import movieRouter from "./routes/movie.routes.js";
// import { rateLimitMiddleware } from "./middleware/rateLimit.middleware.js";
import { rateLimitMiddleware } from "./middleware/rateLimitV2.middleware.js";
import notificationRouter from "./routes/notification.routes.js";
// import "./services/workers/notificationWorker.service.js";
// import "./services/workers/workerRabbitMq.service.js";
import socketRouter from "./routes/socket.routes.js";
import { startWorkers } from "./services/workers/workerManager.service.js";

// import testRouter from "./test/testNotification.js";
import dlqAdminRoutes from "./routes/dlqAdmin.routes.js";

const app = express();
dotenv.config();
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());
app.use(helmet());
app.use(compression());

app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"];
  req.requestId = requestId ? requestId : uuidv7();
  myLogger.log(`Input params :: ${req.method}::`, [
    req.path, //
    { requestId: req.requestId },
    req.method === "POST" ? req.body : req.query,
  ]);
  //   res.setHeader("x-request-id", requestId); // trả lại client biết luôn
  next();
});

// dbs
(async () => {
  try {
    await db.connect();
    console.log("🚀 MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed", err);
    process.exit(1); // dừng app nếu connect fail
  }
})();

// Start workers
startWorkers().catch(console.error);

// Middleware
app.use("/v1/api/", rateLimitMiddleware);

// API Routes
app.get("/", (req, res) => res.send("Server is Live"));
// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/v1/api/shows", showRouter);
app.use("/v1/api/bookings", bookingRouter);
app.use("/v1/api/admin", adminRouter);
app.use("/v1/api/users", userRouter);
app.use("/v1/api/cinemas", cinemaRouter);
app.use("/v1/api/movies", movieRouter);
// Mount payment routes
app.use("/v1/api/payment", paymentRoutes);
// Route dashboard
app.use("/v1/api/queue", queueDashboard);
app.use("/v1/api/notifications", notificationRouter);
app.use("/v1/api/socket", socketRouter);

// app.use("/api", testRouter);
// Thêm routes quản lý DLQ (cần authentication trong thực tế)
app.use("/api/admin/dlq", dlqAdminRoutes);

// handing error
app.use((req, res, next) => {
  next(new NotFoundError());
});

app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  const responseTime = error.now ? Date.now() - error.now : "unknown";
  const resMessage = `${error.status} - ${responseTime}ms - Response: ${JSON.stringify(error)}`;
  const logData = [req.path, { requestId: req.requestId }, { message: error.message }];

  if (error.rollbackError) {
    logData.push({ rollbackError: error.rollbackError.message });
  }

  myLogger.error(resMessage, logData);

  return res.status(statusCode).json({
    status: "error",
    success: false,
    code: statusCode,
    stack: error.stack, // show detail error
    message: error.message || "Internal Server Error",
  });
});

export default app;
