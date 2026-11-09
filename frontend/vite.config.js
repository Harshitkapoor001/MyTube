import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    ".."
  );
  const env = loadEnv(mode, envDir, "");
  return {
    envDir,
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.BACKEND_ORIGIN || "http://localhost:8000",
          changeOrigin: true,
        },
        "/health": {
          target: env.BACKEND_ORIGIN || "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
  };
});
