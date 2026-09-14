#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { extractClaudePaths } from "./adapters/claude.mjs";
import { extractCodexPaths } from "./adapters/codex.mjs";
import {
  checkBeforeEdit,
  checkBeforeStop,
  recordEdits,
  recordTurnStart,
} from "./core/gate.mjs";
import { resolveRootFromCwd } from "./core/resolver.mjs";

// 하네스 timeout(180s/300s)보다 여유를 두고 먼저 끊는다 — 하네스가 먼저 죽이면
// 출력 자체가 안 남아 무조건 fail-open이 되므로, 내부에서 먼저 끊어야 block 결정을
// 남길 수 있다.
const PRE_TIMEOUT_MS = 150_000;
const STOP_TIMEOUT_MS = 270_000;

async function main() {
  const mode = process.argv[2];
  const payload = JSON.parse(await readStdin());
  // payload.cwd 는 훅이 실제로 호출된 작업 디렉터리다 — 워크트리 안에서 편집 중이면
  // 이 스크립트 자기 위치(메인 저장소) 기준 ROOT 는 틀린 값이라 여기서 덮어써야 한다.
  resolveRootFromCwd(payload.cwd);

  if (mode === "turn-start") {
    recordTurnStart(payload.session_id);
    return;
  }

  if (mode === "pre") {
    const result = await checkBeforeEdit(extractPaths(payload), PRE_TIMEOUT_MS);
    if (result?.action === "deny") writePreToolDeny(result.reason);
    return;
  }

  if (mode === "post") {
    await recordEdits(extractPaths(payload), payload.session_id);
    return;
  }

  if (mode === "stop") {
    const result = await checkBeforeStop(
      { sessionId: payload.session_id, stopHookActive: payload.stop_hook_active },
      STOP_TIMEOUT_MS,
    );
    if (result?.action === "block") writeStopBlock(result.reason);
    else if (result?.action === "warn") writeStopWarn(result.reason);
    return;
  }

  throw new Error(`unknown mode: ${mode}`);
}

export function extractPaths(payload) {
  return payload?.tool_name === "apply_patch"
    ? extractCodexPaths(payload)
    : extractClaudePaths(payload);
}

function writePreToolDeny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
}

function writeStopBlock(reason) {
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
}

function writeStopWarn(reason) {
  process.stdout.write(JSON.stringify({ systemMessage: reason }));
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((error) => {
    process.stderr.write(`tdd-gate fail-open: ${error?.stack ?? error}\n`);
  });
}
