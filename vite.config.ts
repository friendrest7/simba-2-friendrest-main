import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("react") || id.includes("react-dom")) {
            return "vendor-react";
          }

          if (id.includes("@tanstack")) {
            return "vendor-tanstack";
          }

          if (id.includes("@supabase")) {
            return "vendor-supabase";
          }

          if (id.includes("@radix-ui") || id.includes("lucide-react") || id.includes("recharts")) {
            return "vendor-ui";
          }

          return "vendor";
        },
      },
    },
  },
});
