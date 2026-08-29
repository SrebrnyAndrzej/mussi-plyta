import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vite rozwiązuje aliasy z tsconfig natywnie, plugin jest zbędny.
  resolve: { tsconfigPaths: true },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
