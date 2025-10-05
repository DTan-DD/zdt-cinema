import { initSocket } from "./socket.js";
import app from "./src/app.js";
import http from "http";

const PORT = process.env.PORT || 8000;

// Khởi tạo Socket.IO
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log("connected with port:", PORT);
});

process.on("SIGINT", async () => {
  server.close(() => console.log("disconnected with port:", PORT));
  process.exit(0);
});
