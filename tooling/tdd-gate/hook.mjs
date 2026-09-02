#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { extractClaudePaths } from "./adapters/claude.mjs";
import { extractCodexPaths } from "./adapters/codex.mjs";
import { checkBeforeEdit, checkBeforeStop, recordEdits } from "./core/gate.mjs";

async function main() {
  const mode = process.argv[2];
  const payload = JSON.parse(await readStdin());

  if (mode === "pre") {
    const result = await checkBeforeEdit(extractPaths(payload));
    if (result?.action === "deny") writePreToolDeny(result.reason);
    return;
  }

  if (mode === "post") {
    await recordEdits(extractPaths(payload), payload.session_id);
    return;
  }

  if (mode === "stop") {
    const result = await checkBeforeStop({
      sessionId: payload.session_id,
      stopHookActive: payload.stop_hook_active,
    });
    if (result?.action === "block") writeStopBlock(result.reason);
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
