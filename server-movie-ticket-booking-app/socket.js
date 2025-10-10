import { Server } from "socket.io";
import { protectSocket } from "./src/middleware/auth.middeware.js";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*" },
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

    socket.on("disconnect", () => {
      console.log(`❌ User ${socket.userId} disconnected`);
    });
  });
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export { io };
