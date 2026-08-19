import { defineConfig } from "vitest/config";
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
        new URL("./testing/support/setup/server-only.ts", import.meta.url),
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
            "src/actions/**/*.test.ts",
            "src/adapters/server/**/*.test.ts",
            "src/core/**/*.test.ts",
            "src/app/api/**/*.test.ts",
            "src/boundary.test.ts",
            "src/proxy.test.ts",
          ],
          exclude: ["src/**/*.integration.test.{ts,tsx}"],
          setupFiles: ["./testing/support/setup/node-polyfill.ts"],
          maxWorkers: 2,
        },
      },
      {
        extends: true,
        test: {
          name: "component",
          environment: "jsdom",
          include: [
            "src/ui/**/*.test.{ts,tsx}",
            "src/app/**/*.test.{ts,tsx}",
            "src/adapters/browser/**/*.test.ts",
          ],
          exclude: ["src/**/*.integration.test.{ts,tsx}", "src/app/api/**/*.test.{ts,tsx}"],
          setupFiles: ["./testing/support/setup/jsdom-polyfill.ts"],
          maxWorkers: 2,
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: [
            "src/actions/**/*.integration.test.{ts,tsx}",
            "src/db/**/*.integration.test.{ts,tsx}",
            "src/services/**/*.integration.test.{ts,tsx}",
            "src/app/api/**/*.integration.test.{ts,tsx}",
            "src/app/(main)/page.integration.test.ts",
            "src/app/(main)/_components/PopularProductsSection.integration.test.tsx",
          ],
          globalSetup: ["./testing/support/setup/mongo-server.ts"],
          fileParallelism: false,
          maxWorkers: 1,
          setupFiles: [
            "./testing/support/setup/node-polyfill.ts",
            "./testing/support/setup/jsdom-polyfill.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "integration-component",
          environment: "jsdom",
          include: [
            "src/app/(admin)/admin/layout.integration.test.tsx",
            "src/ui/**/*.integration.test.{ts,tsx}",
          ],
          setupFiles: ["./testing/support/setup/jsdom-polyfill.ts"],
          maxWorkers: 2,
        },
      },
    ],
  },
});
