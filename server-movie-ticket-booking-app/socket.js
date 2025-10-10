import { Server } from "socket.io";
import { protectSocket } from "./src/middleware/auth.middeware.js";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*" },
    // Tăng timeout
    pingTimeout: 60000, // 60s (mặc định 20s)
    pingInterval: 25000, // 25s (mặc định 25s)
  });

  // Dùng middleware chung
  protectSocket(io);

  io.on("connection", (socket) => {
    const { userId, isAdmin } = socket;
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} connected`);

      if (isAdmin) {
        socket.join("admins");
        console.log(`🛠️ Admin ${userId} connected`);
      }
    }

    // Log disconnect reason
    socket.on("disconnect", (reason) => {
      console.log(`❌ [Socket] User ${socket.userId} disconnected | Reason: ${reason} | Socket ID: ${socket.id}`);
    });

    // Log errors
    socket.on("error", (error) => {
      console.error(`⚠️ [Socket] Error for user ${socket.userId}:`, error);
    });
  });
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export { io };
