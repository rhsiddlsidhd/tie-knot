#!/usr/bin/env node
/**
 * Lever B — Stop hook.
 *
 * 이번 턴에 편집된 강제 대상의 형제 test 를 실행하고, red 면 종료를 막는다(TDD 2단계).
 * stop_hook_active 가 켜져 있으면 무한 루프 방지를 위해 기록만 비우고 통과시킨다.
 */

import fs from "node:fs";
import { inspect, turnFile } from "./resolver.mjs";
import { runSiblings } from "./run-tests.mjs";

function block(reason) {
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
  process.exit(0);
}

async function main() {
  const payload = JSON.parse(await readStdin());
  const file = turnFile(payload.session_id);

  let edited;
  try {
    edited = [...new Set(fs.readFileSync(file, "utf8").split("\n").filter(Boolean))];
  } catch {
    return; // 기록 없음 = 강제 대상 편집 없음
  }

  if (payload.stop_hook_active) {
    fs.rmSync(file, { force: true });
    return;
  }

  const siblings = [];
  for (const relPath of edited) {
    const target = await inspect(relPath);
    if (target.enforced) siblings.push(...target.siblings);
  }

  if (siblings.length === 0) {
    fs.rmSync(file, { force: true });
    return;
  }

  const { green, failures } = runSiblings(dedupe(siblings));
  if (green) {
    fs.rmSync(file, { force: true });
    return;
  }

  block(
    [
      `TDD gate: 이번 턴에 편집한 파일의 test 가 실패한다. green 을 만들고 끝내라.`,
      ``,
      ...failures.map((f) => `[${f.tier}] ${f.paths.join(", ")}\n${f.output}`),
    ].join("\n"),
  );
}

function dedupe(siblings) {
  const seen = new Map();
  for (const s of siblings) seen.set(s.path, s);
  return [...seen.values()];
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    process.stderr.write(`tdd-gate(stop) fail-open: ${err?.stack ?? err}\n`);
    process.exit(0);
  });
