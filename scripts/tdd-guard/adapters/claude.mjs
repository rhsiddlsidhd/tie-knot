#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPreEditResponse } from "./pre-edit-response.mjs";

const command = process.argv[2];
let input = "";
for await (const chunk of process.stdin) input += chunk;
const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), "../bin/guard.mjs");
const result = spawnSync(process.execPath, [cli, command], { input, encoding: "utf8" });

if (command !== "pre-edit") {
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  process.exit(result.status ?? 2);
}

if (result.status === 0) {
  process.stdout.write("{}\n");
  process.exit(0);
}

const { reason, hookSpecificOutput } = buildPreEditResponse(result, command);
process.stdout.write(`${JSON.stringify({ hookSpecificOutput }, null, 2)}\n`);
process.stderr.write(result.stderr ? `${reason}\n${result.stderr}` : `${reason}\n`);
process.exit(0);
