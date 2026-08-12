import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { afterAll, describe, expect, it } from "vitest";
import { buildPreEditResponse } from "../pre-edit-response.mjs";

const projectRoot = path.resolve(import.meta.dirname, "../../../..");
const claudeAdapter = path.join(projectRoot, "scripts/tdd-guard/adapters/claude.mjs");
const codexAdapter = path.join(projectRoot, "scripts/tdd-guard/adapters/codex.mjs");
const roots = [];

function write(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value);
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tdd-adapter-fixture-"));
  const state = fs.mkdtempSync(path.join(os.tmpdir(), "tdd-adapter-state-"));
  roots.push(root, state);
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "guard@example.test"], { cwd: root });
  execFileSync("git", ["config", "user.name", "TDD Guard"], { cwd: root });
  write(path.join(root, "package.json"), "{}\n");
  write(path.join(root, "package-lock.json"), "{}\n");
  write(path.join(root, "stryker.config.mjs"), "export default {};\n");
  write(path.join(root, "vitest.config.ts"), `
    import { defineConfig } from "vitest/config";
    export default defineConfig({ test: { projects: [{ test: { name: "unit", environment: "node", include: ["src/**/*.test.ts"] } }] } });
  `);
  write(path.join(root, "src/value.ts"), "export const value = 1;\n");
  fs.symlinkSync(path.join(projectRoot, "node_modules"), path.join(root, "node_modules"), "dir");
  execFileSync("git", ["add", "package.json", "package-lock.json", "stryker.config.mjs", "vitest.config.ts", "src/value.ts"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "baseline"], { cwd: root });
  return { root, state };
}

function runAdapter(adapter, root, state, input) {
  return spawnSync(process.execPath, [adapter, "pre-edit"], {
    cwd: root,
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, TDD_GUARD_ROOT: root, TDD_GUARD_SESSION_ID: "fixture-session", XDG_STATE_HOME: state },
  });
}

afterAll(() => roots.forEach((root) => fs.rmSync(root, { recursive: true, force: true })));

describe("buildPreEditResponse", () => {
  it("guard의 deny reason을 hookSpecificOutput.permissionDecisionReason에 그대로 담는다", () => {
    const result = { status: 2, stdout: JSON.stringify({ permissionDecision: "deny", reason: "TDD Guard: src/value.ts 편집 전 테스트를 변경하세요." }) };
    const { reason, hookSpecificOutput } = buildPreEditResponse(result, "pre-edit");

    expect(reason).toBe("TDD Guard: src/value.ts 편집 전 테스트를 변경하세요.");
    expect(hookSpecificOutput).toEqual({
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "TDD Guard: src/value.ts 편집 전 테스트를 변경하세요.",
    });
  });

  it("guard stdout이 JSON이 아니거나 reason이 없으면 폴백 사유를 쓴다", () => {
    const crashed = { status: 1, stdout: "ReferenceError: boom\n    at file.mjs:1:1" };
    const { reason } = buildPreEditResponse(crashed, "pre-edit");

    expect(reason).toBe("TDD Guard 실행 오류. 편집을 차단합니다. node scripts/tdd-guard/bin/guard.mjs pre-edit를 직접 실행하세요.");
  });
});

describe("claude.mjs pre-edit 어댑터", () => {
  it("deny를 구조화 stdout과 stderr 양쪽에 같은 reason으로 전달한다", () => {
    const { root, state } = fixture();
    const result = runAdapter(claudeAdapter, root, state, {
      session_id: "fixture-session",
      tool_name: "Write",
      tool_input: { file_path: path.join(root, "src/value.ts") },
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
    const stdout = JSON.parse(result.stdout);
    expect(stdout).toEqual({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "TDD Guard: src/value.ts 편집 전 테스트를 변경하고 npm run test:red -- --scope <scope>를 실행하세요.",
      },
    });
    expect(result.stderr).toContain(stdout.hookSpecificOutput.permissionDecisionReason);
  });

  it("guard 크래시 시에도 같은 형태로 폴백 사유를 전달한다", () => {
    const brokenRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tdd-adapter-broken-"));
    roots.push(brokenRoot);
    const state = fs.mkdtempSync(path.join(os.tmpdir(), "tdd-adapter-broken-state-"));
    roots.push(state);

    const result = runAdapter(claudeAdapter, brokenRoot, state, {
      session_id: "fixture-session",
      tool_name: "Write",
      tool_input: { file_path: path.join(brokenRoot, "src/value.ts") },
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
    const stdout = JSON.parse(result.stdout);
    expect(stdout.hookSpecificOutput.permissionDecision).toBe("deny");
    expect(stdout.hookSpecificOutput.permissionDecisionReason).toBe(
      "TDD Guard 실행 오류. 편집을 차단합니다. node scripts/tdd-guard/bin/guard.mjs pre-edit를 직접 실행하세요.",
    );
    expect(result.stderr).toContain(stdout.hookSpecificOutput.permissionDecisionReason);
  });

  it("allow일 때는 차단하지 않는다", () => {
    const { root, state } = fixture();
    write(path.join(root, "src/value.test.ts"), `
      import { describe, expect, it } from "vitest";
      import { value } from "./value";
      describe("value", () => { it("새 계약", () => { expect(value).toBe(2); }); });
    `);
    const red = spawnSync(process.execPath, [path.join(projectRoot, "scripts/tdd-guard/bin/guard.mjs"), "prove-red", "--scope", "unit"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, TDD_GUARD_ROOT: root, TDD_GUARD_SESSION_ID: "fixture-session", XDG_STATE_HOME: state },
    });
    expect(red.status, red.stderr || red.stdout).toBe(0);

    const result = runAdapter(claudeAdapter, root, state, {
      session_id: "fixture-session",
      tool_name: "Write",
      tool_input: { file_path: path.join(root, "src/value.ts") },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toBe("{}\n");
  });
});

describe("codex.mjs pre-edit 어댑터 (동작 불변 확인)", () => {
  it("deny를 구조화 stdout으로 전달하고 stderr는 guard의 원본 그대로 둔다", () => {
    const { root, state } = fixture();
    const result = runAdapter(codexAdapter, root, state, {
      session_id: "fixture-session",
      tool_name: "apply_patch",
      tool_input: { command: "*** Begin Patch\n*** Update File: src/value.ts\n*** End Patch" },
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: "TDD Guard: src/value.ts 편집 전 테스트를 변경하고 npm run test:red -- --scope <scope>를 실행하세요.",
      },
    });
    expect(result.stderr).toBe("");
  });
});
