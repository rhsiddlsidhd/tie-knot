import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function projectFor(root, test, scope) {
  if (scope !== "integration") return "unit";
  if (test.startsWith("src/client/") || test.startsWith("src/app/") && test.includes("/_hooks/")) {
    return "integration-client";
  }
  if (test.startsWith("src/app/") && !test.startsWith("src/app/api/")) return "integration-app";
  return "integration-server";
}

function runProject(root, tests, project, timeout) {
  const reportFile = path.join(os.tmpdir(), `tdd-vitest-${process.pid}-${Date.now()}.json`);
  const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "--project", project, "--reporter=json", `--outputFile=${reportFile}`, ...tests], {
    cwd: root, encoding: "utf8", timeout, env: { ...process.env, FORCE_COLOR: "0" },
  });
  let report;
  try { report = JSON.parse(fs.readFileSync(reportFile, "utf8")); } catch {}
  fs.rmSync(reportFile, { force: true });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  const environmentError = result.error?.code === "ETIMEDOUT" || /Failed to resolve import|Cannot find module|SyntaxError|global setup|listen EPERM/i.test(output) || !report;
  const failedTests = report?.testResults?.flatMap((suite) => suite.assertionResults?.filter((test) => test.status === "failed").map((test) => test.fullName || test.title) ?? []) ?? [];
  return { exitCode: result.status ?? 1, passed: result.status === 0, environmentError, failedTests, output };
}

export function runVitest(root, tests, scope, timeout = 120_000) {
  const groups = new Map();
  for (const test of tests) {
    const project = projectFor(root, test, scope);
    groups.set(project, [...(groups.get(project) ?? []), test]);
  }
  const results = [...groups].map(([project, files]) => runProject(root, files, project, timeout));
  return {
    exitCode: results.some((result) => result.exitCode !== 0) ? 1 : 0,
    passed: results.every((result) => result.passed),
    environmentError: results.some((result) => result.environmentError),
    failedTests: results.flatMap((result) => result.failedTests),
    output: results.map((result) => result.output).join("\n"),
  };
}
