#!/usr/bin/env node
/**
 * 이번 턴에 실제로 편집된 강제 대상 경로를 기록한다. Stop hook(Lever B)이 소비한다.
 * 훅이 파일을 쓰는 유일한 지점이다.
 */

import fs from "node:fs";
import { ensureCacheDir, inspect, turnFile } from "./resolver.mjs";

async function main() {
  const payload = JSON.parse(await readStdin());
  if (!["Write", "Edit", "MultiEdit"].includes(payload.tool_name)) return;

  const filePath = payload.tool_input?.file_path;
  if (!filePath) return;

  const target = await inspect(filePath);
  if (!target.enforced) return;

  ensureCacheDir();
  fs.appendFileSync(turnFile(payload.session_id), `${target.relPath}\n`);
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
    process.stderr.write(`tdd-gate(post-tool-use) fail-open: ${err?.stack ?? err}\n`);
    process.exit(0);
  });
