import { configDefaults, defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(
        new URL("./test/support/setup/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: [
            "src/actions/**/*.unit.test.ts",
            "src/adapters/server/**/*.unit.test.ts",
            "src/core/**/*.unit.test.ts",
            "src/app/api/**/*.unit.test.ts",
            "src/ui/stores/slices/**/*.unit.test.ts",
            "src/ui/context/**/reducer.unit.test.ts",
            "src/boundary.unit.test.ts",
            "src/proxy.unit.test.ts",
          ],
          setupFiles: ["./test/support/setup/node-polyfill.ts"],
          maxWorkers: 2,
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "jsdom",
          include: [
            "src/ui/**/*.component.test.{ts,tsx}",
            "src/app/**/*.component.test.{ts,tsx}",
            "src/adapters/browser/**/*.component.test.ts",
          ],
          exclude: [
            ...configDefaults.exclude,
            "src/app/api/**",
            "src/ui/stores/slices/**",
            "src/ui/context/**/reducer.*",
          ],
          setupFiles: ["./test/support/setup/jsdom-polyfill.ts"],
          maxWorkers: 2,
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["test/integration/**/*.integration.test.{ts,tsx}"],
          globalSetup: ["./test/support/setup/mongo-server.ts"],
          fileParallelism: false,
          maxWorkers: 1,
          setupFiles: [
            "./test/support/setup/node-polyfill.ts",
            "./test/support/setup/jsdom-polyfill.ts",
          ],
        },
      },
    ],
  },
});
