import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["socket.io-client"],
  },
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      overlay: false,
    },
    host: true, // Listen on all addresses
    proxy: {}, // Add proxy configuration if needed
  },
});
