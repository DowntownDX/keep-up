import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative assets keep the same build working at a domain root and under a
  // GitHub Pages project path such as /keep-up/.
  base: "./",
  plugins: [react()],
  test: {
    environment: "node",
  },
});
