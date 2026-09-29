import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  ROOT,
  computeTurnChanges,
  gitDirtySrcHashes,
  gitHead,
  isFormattingOnlyChange,
  readTurnSnapshot,
  resolveRootFromCwd,
  snapshotFile,
  toRelative,
  writeTurnSnapshot,
} from "./resolver.mjs";

const MAIN_ROOT = ROOT;
const PROBE_DIR = path.join(ROOT, "src", "core", "__gate_probe__");
const PROBE_FILE = path.join(PROBE_DIR, "probe.ts");
const SESSION_ID = "resolver-unit-test-probe";

function cleanup() {
  resolveRootFromCwd(MAIN_ROOT);
  fs.rmSync(PROBE_DIR, { recursive: true, force: true });
  fs.rmSync(snapshotFile(SESSION_ID), { force: true });
}

afterEach(cleanup);

describe("gitHead", () => {
  it("실제 HEAD sha와 일치한다", () => {
    const expected = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
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

describe("computeTurnChanges — 턴 중 HEAD 이동", () => {
  // 메인 저장소 HEAD 를 건드리지 않도록 격리된 임시 저장소에서 커밋·checkout 을 재현한다.
  // 턴 시작 전 커밋은 committer date 를 과거로 고정해 "pull 로 받은 남의 커밋"을 흉내 낸다.
  const OLD_DATE = "2020-01-01T00:00:00Z";
  let repoDir;

  function repoGit(args, env = {}) {
    return execFileSync(
      "git",
      [
        "-c",
        "user.name=probe",
        "-c",
        "user.email=probe@example.com",
        "-c",
        "commit.gpgsign=false",
        "-c",
        "core.hooksPath=/dev/null",
        ...args,
      ],
      { cwd: repoDir, encoding: "utf8", env: { ...process.env, ...env } },
    );
  }

  function commitFile(relPath, content, env) {
    fs.mkdirSync(path.dirname(path.join(repoDir, relPath)), {
      recursive: true,
    });
    fs.writeFileSync(path.join(repoDir, relPath), content);
    repoGit(["add", relPath]);
    repoGit(["commit", "-q", "-m", `touch ${relPath}`], env);
  }

  const oldCommit = {
    GIT_AUTHOR_DATE: OLD_DATE,
    GIT_COMMITTER_DATE: OLD_DATE,
  };

  beforeEach(() => {
    repoDir = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), "tdd-gate-head-")),
    );
    repoGit(["init", "-q", "-b", "base"]);
    commitFile("src/base.ts", "export const base = 1;\n", oldCommit);
    resolveRootFromCwd(repoDir);
  });

  afterEach(() => {
    resolveRootFromCwd(MAIN_ROOT);
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it("턴 안에서 만든 커밋의 src/ 변경은 잡는다", () => {
    writeTurnSnapshot(SESSION_ID);

    commitFile("src/edited.ts", "export const edited = 1;\n");

    expect(computeTurnChanges(SESSION_ID)).toEqual(["src/edited.ts"]);
  });

  it("턴 시작 전에 만들어진 커밋을 fast-forward로 받아오면 잡지 않는다", () => {
    repoGit(["checkout", "-q", "-b", "upstream"]);
    commitFile("src/pulled.ts", "export const pulled = 1;\n", oldCommit);
    repoGit(["checkout", "-q", "base"]);
    writeTurnSnapshot(SESSION_ID);

    repoGit(["merge", "-q", "--ff-only", "upstream"]);

    expect(computeTurnChanges(SESSION_ID)).toEqual([]);
  });

  it("스냅샷에 있던 커밋이 빠진 브랜치로 checkout하면 잡지 않는다", () => {
    repoGit(["checkout", "-q", "-b", "ahead"]);
    commitFile("src/ahead-only.ts", "export const ahead = 1;\n", oldCommit);
    writeTurnSnapshot(SESSION_ID);

    repoGit(["checkout", "-q", "base"]);

    expect(computeTurnChanges(SESSION_ID)).toEqual([]);
  });
});

describe("isFormattingOnlyChange", () => {
  it("Prettier 정규화 결과가 같으면 true를 반환한다", async () => {
    fs.mkdirSync(PROBE_DIR, { recursive: true });
    fs.writeFileSync(PROBE_FILE, "export const probe={value:1};\n");
    writeTurnSnapshot(SESSION_ID);
    fs.writeFileSync(PROBE_FILE, "export const probe = { value: 1 };\n");

    await expect(
      isFormattingOnlyChange(SESSION_ID, "src/core/__gate_probe__/probe.ts"),
    ).resolves.toBe(true);
  });

  it("Prettier 정규화 후에도 내용이 다르면 false를 반환한다", async () => {
    fs.mkdirSync(PROBE_DIR, { recursive: true });
    fs.writeFileSync(PROBE_FILE, "export const probe={value:1};\n");
    writeTurnSnapshot(SESSION_ID);
    fs.writeFileSync(PROBE_FILE, "export const probe = { value: 2 };\n");

    await expect(
      isFormattingOnlyChange(SESSION_ID, "src/core/__gate_probe__/probe.ts"),
    ).resolves.toBe(false);
  });
});

describe("resolveRootFromCwd", () => {
  // 워크트리는 실제 운영에서 메인 저장소 안(.claude/worktrees/**)에 중첩된다.
  // 같은 구조로 만들어야 "ROOT 를 안 바꾸면 워크트리 파일의 relPath 에 접두사가
  // 남아 src/ 판정이 깨진다"는 원래 버그를 재현할 수 있다.
  const WORKTREE_DIR = path.join(MAIN_ROOT, ".tmp-gate-worktree-probe");

  function removeWorktree() {
    execFileSync("git", ["worktree", "remove", "--force", WORKTREE_DIR], {
      cwd: MAIN_ROOT,
    });
  }

  it("워크트리 안의 cwd 를 주면 그 워크트리의 git toplevel 로 ROOT 를 바꾼다", () => {
    execFileSync("git", ["worktree", "add", "--detach", WORKTREE_DIR, "HEAD"], {
      cwd: MAIN_ROOT,
    });
    try {
      resolveRootFromCwd(WORKTREE_DIR);
      expect(ROOT).toBe(fs.realpathSync(WORKTREE_DIR));
      expect(ROOT).not.toBe(MAIN_ROOT);
    } finally {
      resolveRootFromCwd(MAIN_ROOT);
      removeWorktree();
    }
  });

  it("ROOT 를 워크트리로 바꾸면 그 워크트리 안 파일이 다시 src/ 로 정규화된다 (회귀)", () => {
    execFileSync("git", ["worktree", "add", "--detach", WORKTREE_DIR, "HEAD"], {
      cwd: MAIN_ROOT,
    });
    const fileInWorktree = path.join(WORKTREE_DIR, "src", "core", "foo.ts");

    try {
      // 고침 전 재현: 메인 ROOT 기준으로 워크트리 파일을 relative 하면
      // ".tmp-gate-worktree-probe/src/..." 가 되어 "src/" 로 시작하지 않는다.
      expect(toRelative(fileInWorktree)).not.toMatch(/^src\//);

      resolveRootFromCwd(WORKTREE_DIR);
      expect(toRelative(fileInWorktree)).toBe("src/core/foo.ts");
    } finally {
      resolveRootFromCwd(MAIN_ROOT);
      removeWorktree();
    }
  });

  it("cwd 가 git 저장소가 아니면 ROOT 를 그대로 둔다 (fail-open)", () => {
    const notAGitDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "tdd-gate-not-git-"),
    );
    try {
      resolveRootFromCwd(notAGitDir);
      expect(ROOT).toBe(MAIN_ROOT);
    } finally {
      fs.rmSync(notAGitDir, { recursive: true, force: true });
    }
  });
});
