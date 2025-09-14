import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0", // mở cho tất cả IP
    port: 5173,
    strictPort: true,
    origin: "https://11ee3a738470.ngrok-free.app", // chèn đúng link ngrok
  },
});
