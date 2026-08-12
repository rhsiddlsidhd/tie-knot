import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const related: string[] = JSON.parse(process.env.STRYKER_RELATED_TESTS ?? "[]");
const take = (predicate: (file: string) => boolean) => related.filter(predicate);
const server = (file: string) => file.includes(".integration.test.")
  && (file.startsWith("src/server/") || file.startsWith("src/app/api/"));
const app = (file: string) => file.includes(".integration.test.")
  && file.startsWith("src/app/")
  && !file.startsWith("src/app/api/")
  && !file.includes("/_hooks/");
const client = (file: string) => file.includes(".integration.test.")
  && (file.startsWith("src/client/") || file.startsWith("src/app/") && file.includes("/_hooks/"));
const groups = [
  { name: "mutation-unit", files: take((file) => !server(file) && !app(file) && !client(file)), environment: "jsdom" },
  { name: "mutation-client", files: take(client), environment: "jsdom" },
  { name: "mutation-server", files: take(server), environment: "node", mongo: true },
  { name: "mutation-app", files: take(app), environment: "jsdom", mongo: true },
].filter((group) => group.files.length);

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./testing/support/setup/jsdom-polyfill.ts"],
    projects: groups.map((group) => ({
      extends: true,
      test: {
        name: group.name,
        include: group.files,
        environment: group.environment,
        setupFiles: group.environment === "node" ? ["./testing/support/setup/node-polyfill.ts"] : ["./testing/support/setup/jsdom-polyfill.ts"],
        globalSetup: group.mongo ? ["./testing/support/setup/mongo-server.ts"] : [],
        fileParallelism: !group.mongo,
        maxWorkers: group.mongo ? 1 : 2,
      },
    })),
  },
});
