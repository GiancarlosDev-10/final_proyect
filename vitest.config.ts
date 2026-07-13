import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    // La caché de transformación se corrompe en Windows al editar y re-correr
    // (falso "Cannot read properties of undefined (reading 'config')").
    cache: false,
  },
});
