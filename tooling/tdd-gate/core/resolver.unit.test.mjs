import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  ROOT,
  computeTurnChanges,
  gitDirtySrcHashes,
  gitHead,
  readTurnSnapshot,
  snapshotFile,
  writeTurnSnapshot,
} from "./resolver.mjs";

const PROBE_DIR = path.join(ROOT, "src", "core", "__gate_probe__");
const PROBE_FILE = path.join(PROBE_DIR, "probe.ts");
const SESSION_ID = "resolver-unit-test-probe";

function cleanup() {
  fs.rmSync(PROBE_DIR, { recursive: true, force: true });
  fs.rmSync(snapshotFile(SESSION_ID), { force: true });
}

afterEach(cleanup);

describe("gitHead", () => {
  it("실제 HEAD sha와 일치한다", () => {
    const expected = execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
    expect(gitHead()).toBe(expected);
  });
});

describe("gitDirtySrcHashes", () => {
  it("src/ 아래 untracked 파일을 content hash와 함께 잡는다", () => {
    fs.mkdirSync(PROBE_DIR, { recursive: true });
    fs.writeFileSync(PROBE_FILE, "export const probe = 1;\n");

    const expectedHash = execFileSync("git", ["hash-object", PROBE_FILE], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();

    const hashes = gitDirtySrcHashes();
    expect(hashes["src/core/__gate_probe__/probe.ts"]).toBe(expectedHash);
  });
});

describe("writeTurnSnapshot / readTurnSnapshot / computeTurnChanges", () => {
  it("스냅샷 이후 새로 dirty해진 파일만 변경분으로 잡는다", () => {
    writeTurnSnapshot(SESSION_ID);
    const snapshot = readTurnSnapshot(SESSION_ID);
    expect(snapshot.head).toBe(gitHead());

    fs.mkdirSync(PROBE_DIR, { recursive: true });
    fs.writeFileSync(PROBE_FILE, "export const probe = 1;\n");

    const changed = computeTurnChanges(SESSION_ID);
    expect(changed).toContain("src/core/__gate_probe__/probe.ts");
  });

  it("스냅샷 대비 내용이 그대로면 변경분에서 빠진다", () => {
    fs.mkdirSync(PROBE_DIR, { recursive: true });
    fs.writeFileSync(PROBE_FILE, "export const probe = 1;\n");
    writeTurnSnapshot(SESSION_ID);

    const changed = computeTurnChanges(SESSION_ID);
    expect(changed).not.toContain("src/core/__gate_probe__/probe.ts");
  });

  it("스냅샷이 없으면 null을 반환한다", () => {
    expect(computeTurnChanges("no-such-session")).toBeNull();
  });
});
