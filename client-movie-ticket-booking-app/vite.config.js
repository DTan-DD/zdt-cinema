import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/", // hoặc base: "https://11ee3a738470.ngrok-free.app/"
  server: {
    host: "0.0.0.0",
    port: 5173,
    // origin: "https://2b9f4f6289a1.ngrok-free.app",
  },
});
