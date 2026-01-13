import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@jimbo77/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@jimbo77/core": path.resolve(__dirname, "../../packages/core/src"),
    },
  },
});
