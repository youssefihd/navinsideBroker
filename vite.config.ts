// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  base: "/",
  server: {
    host: true,  // or "0.0.0.0"
    port: 5173,  // default for Vite (avoid conflict with backend 8080)
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
  },
}));
