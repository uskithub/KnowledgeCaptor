import { defineConfig } from "vite";

export default defineConfig({
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