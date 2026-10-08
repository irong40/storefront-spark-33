import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        // Split stable vendor code into its own long-cached chunks so an app deploy
        // does not force visitors to re-download React, Supabase or Square.
        // Radix is left out on purpose: one shared Radix chunk pulls the Admin- and
        // Checkout-only Radix packages into the first page load (+16.7 KB gzip, measured).
        manualChunks(id: string) {
          const file = id.replace(/\\/g, "/");
          if (!file.includes("/node_modules/")) return undefined;
          if (/\/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run)\//.test(file)) {
            return "vendor-react";
          }
          if (file.includes("/node_modules/@supabase/")) return "vendor-supabase";
          if (/\/node_modules\/(react-square-web-payments-sdk|@square)\//.test(file)) {
            return "vendor-square";
          }
          return undefined;
        },
      },
    },
  },
}));
