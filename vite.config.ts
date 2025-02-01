import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        content: "src/content.ts",
      },
      output: {
        entryFileNames: "[name].js",
        inlineDynamicImports: true,
        format: "iife",
      },
    },
    outDir: "dist",
    emptyOutDir: false,
  },
});
