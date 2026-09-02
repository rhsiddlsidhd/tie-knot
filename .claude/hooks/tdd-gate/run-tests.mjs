/** 형제 test 를 tier 별로 좁혀 실행한다. --project 로 좁히지 않으면 integration 의
 *  mongo globalSetup 이 같이 기동해 비용이 폭증한다. */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { ROOT } from "./resolver.mjs";

const VITEST_BIN = path.join(ROOT, "node_modules", ".bin", "vitest");

/** @param {{path: string, tier: string}[]} siblings */
export function runSiblings(siblings, timeout = 180_000) {
  const byTier = new Map();
  for (const s of siblings) {
    if (!byTier.has(s.tier)) byTier.set(s.tier, []);
    byTier.get(s.tier).push(s.path);
  }

  const failures = [];
  for (const [tier, paths] of byTier) {
    const result = spawnSync(
      VITEST_BIN,
      ["run", "--project", tier, "--reporter=dot", ...paths],
      { cwd: ROOT, encoding: "utf8", timeout, env: { ...process.env, CI: "1" } },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) {
      failures.push({ tier, paths, output: tail(result.stdout, result.stderr) });
    }
  }
  return { green: failures.length === 0, failures };
}

function tail(stdout, stderr) {
  const lines = `${stdout ?? ""}${stderr ?? ""}`.trimEnd().split("\n");
  return lines.slice(-25).join("\n");
}
