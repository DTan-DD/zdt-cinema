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
  const userSockets = new Map(); // userId -> Set(socketIds)

  io.on("connection", (socket) => {
    const { userId, isAdmin } = socket;

    if (userId) {
      // Join room riêng của user
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} connected with socket ${socket.id}`);

      // Thêm socket vào list
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);

      // Nếu là admin → join room admin
      if (isAdmin) {
        socket.join("admins");
        console.log(`🛠️ Admin ${userId} connected`);
      }
    }

    socket.on("disconnect", (reason) => {
      console.log(`❌ User ${userId} disconnected | socket: ${socket.id} | reason: ${reason}`);

      // Xóa socket khỏi map
      if (userSockets.has(userId)) {
        const sockets = userSockets.get(userId);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          console.log(`👋 User ${userId} fully disconnected (no active tabs)`);
        }
      }
    });

    socket.on("error", (error) => {
      console.error(`⚠️ Socket error for user ${userId}:`, error);
    });
  });
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export { io };
