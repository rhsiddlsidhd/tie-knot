import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const mockRunSiblings = vi.fn();
vi.mock("./run-tests.mjs", () => ({
  runSiblings: (...args) => mockRunSiblings(...args),
}));

const mockInspect = vi.fn();
const mockComputeTurnChanges = vi.fn();
const mockGitDirtySrcHashes = vi.fn();
const mockWriteTurnSnapshot = vi.fn();

vi.mock("./resolver.mjs", () => ({
  inspect: (...args) => mockInspect(...args),
  computeTurnChanges: (...args) => mockComputeTurnChanges(...args),
  gitDirtySrcHashes: (...args) => mockGitDirtySrcHashes(...args),
  writeTurnSnapshot: (...args) => mockWriteTurnSnapshot(...args),
  ensureCacheDir: () => {},
  turnFile: () => turnFilePath,
}));

const { checkBeforeEdit, checkBeforeStop, recordEdits, recordTurnStart } =
  await import("./gate.mjs");

let tmpDir;
let turnFilePath;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tdd-gate-test-"));
  turnFilePath = path.join(tmpDir, "turn.txt");
  mockComputeTurnChanges.mockReturnValue([]);
  mockGitDirtySrcHashes.mockReturnValue({});
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.clearAllMocks();
});

const enforcedTarget = (overrides = {}) => ({
  relPath: "src/actions/order.ts",
  enforced: true,
  tier: "unit",
  candidates: [
    {
      path: "src/actions/order.unit.test.ts",
      tier: "unit",
      suffix: "unit.test.ts",
    },
  ],
  recommended: {
    path: "src/actions/order.unit.test.ts",
    tier: "unit",
    suffix: "unit.test.ts",
  },
  siblings: [{ path: "src/actions/order.unit.test.ts", tier: "unit" }],
  exists: true,
  ...overrides,
});

describe("checkBeforeEdit", () => {
  it("op이 delete면 inspect도 호출하지 않고 통과시킨다", async () => {
    const result = await checkBeforeEdit([
      { path: "src/actions/legacy.ts", op: "delete" },
    ]);
    expect(result).toBeNull();
    expect(mockInspect).not.toHaveBeenCalled();
  });

  it("형제 test 실행이 timeout 되면 green/red 판정 대신 deny 한다", async () => {
    mockInspect.mockResolvedValue(enforcedTarget({ exists: false }));
    mockRunSiblings.mockReturnValue({
      green: false,
      failures: [
        {
          tier: "unit",
          paths: ["src/actions/order.unit.test.ts"],
          output: "x",
          timedOut: true,
        },
      ],
    });

    const result = await checkBeforeEdit([
      { path: "src/actions/order.ts", op: "add" },
    ]);
    expect(result.action).toBe("deny");
    expect(result.reason).toContain("제한 시간을 초과");
  });

  it("timeout 아닌 순수 red면 신규 파일 생성을 허용한다", async () => {
    mockInspect.mockResolvedValue(enforcedTarget({ exists: false }));
    mockRunSiblings.mockReturnValue({
      green: false,
      failures: [
        {
          tier: "unit",
          paths: ["src/actions/order.unit.test.ts"],
          output: "x",
          timedOut: false,
        },
      ],
    });

    const result = await checkBeforeEdit([
      { path: "src/actions/order.ts", op: "add" },
    ]);
    expect(result).toBeNull();
  });

  it("처음부터 green이면 신규 파일 생성을 deny 한다", async () => {
    mockInspect.mockResolvedValue(enforcedTarget({ exists: false }));
    mockRunSiblings.mockReturnValue({ green: true, failures: [] });

    const result = await checkBeforeEdit([
      { path: "src/actions/order.ts", op: "add" },
    ]);
    expect(result.action).toBe("deny");
    expect(result.reason).toContain("이미 통과");
  });
});

describe("checkBeforeStop", () => {
  it("turnFile 기록과 git 변경분을 합쳐 형제 test를 검사한다", async () => {
    fs.writeFileSync(turnFilePath, "src/actions/order.ts\n");
    mockComputeTurnChanges.mockReturnValue(["src/actions/refund.ts"]);
    mockInspect.mockImplementation(async (relPath) => {
      if (relPath === "src/actions/order.ts") {
        return enforcedTarget({
          siblings: [{ path: "src/actions/order.unit.test.ts", tier: "unit" }],
        });
      }
      return enforcedTarget({
        relPath: "src/actions/refund.ts",
        siblings: [{ path: "src/actions/refund.unit.test.ts", tier: "unit" }],
      });
    });
    mockRunSiblings.mockReturnValue({ green: true, failures: [] });

    await checkBeforeStop({ sessionId: "s1", stopHookActive: false });

    const [siblingsArg] = mockRunSiblings.mock.calls[0];
    const paths = siblingsArg.map((s) => s.path).sort();
    expect(paths).toEqual([
      "src/actions/order.unit.test.ts",
      "src/actions/refund.unit.test.ts",
    ]);
  });

  it("red면 block 하고 turnFile을 남긴다", async () => {
    fs.writeFileSync(turnFilePath, "src/actions/order.ts\n");
    mockInspect.mockResolvedValue(enforcedTarget());
    mockRunSiblings.mockReturnValue({
      green: false,
      failures: [
        {
          tier: "unit",
          paths: ["src/actions/order.unit.test.ts"],
          output: "fail",
        },
      ],
    });

    const result = await checkBeforeStop({
      sessionId: "s1",
      stopHookActive: false,
    });
    expect(result.action).toBe("block");
    expect(fs.existsSync(turnFilePath)).toBe(true);
  });

  it("stop_hook_active=true 인데 여전히 red면 warn 하고 turnFile을 남긴다(빚 이월)", async () => {
    fs.writeFileSync(turnFilePath, "src/actions/order.ts\n");
    mockInspect.mockResolvedValue(enforcedTarget());
    mockRunSiblings.mockReturnValue({
      green: false,
      failures: [
        {
          tier: "unit",
          paths: ["src/actions/order.unit.test.ts"],
          output: "fail",
        },
      ],
    });

    const result = await checkBeforeStop({
      sessionId: "s1",
      stopHookActive: true,
    });
    expect(result.action).toBe("warn");
    expect(fs.existsSync(turnFilePath)).toBe(true);
  });

  it("green이면 turnFile을 지우고 통과시킨다", async () => {
    fs.writeFileSync(turnFilePath, "src/actions/order.ts\n");
    mockInspect.mockResolvedValue(enforcedTarget());
    mockRunSiblings.mockReturnValue({ green: true, failures: [] });

    const result = await checkBeforeStop({
      sessionId: "s1",
      stopHookActive: false,
    });
    expect(result).toBeNull();
    expect(fs.existsSync(turnFilePath)).toBe(false);
  });

  it("존재하는데 sibling test가 0개면 test 없음으로 block 한다(Bash 우회 방지)", async () => {
    fs.writeFileSync(turnFilePath, "src/actions/order.ts\n");
    mockInspect.mockResolvedValue(
      enforcedTarget({ siblings: [], exists: true }),
    );

    const result = await checkBeforeStop({
      sessionId: "s1",
      stopHookActive: false,
    });
    expect(result.action).toBe("block");
    expect(result.reason).toContain("test 가 없다");
    expect(mockRunSiblings).not.toHaveBeenCalled();
  });

  it("이번 턴에 삭제된 파일(exists=false)은 sibling이 없어도 통과시킨다", async () => {
    fs.writeFileSync(turnFilePath, "src/actions/legacy.ts\n");
    mockInspect.mockResolvedValue(
      enforcedTarget({ siblings: [], exists: false }),
    );

    const result = await checkBeforeStop({
      sessionId: "s1",
      stopHookActive: false,
    });
    expect(result).toBeNull();
    expect(fs.existsSync(turnFilePath)).toBe(false);
  });

  it("스냅샷이 없으면(null) 미커밋 전체로 fallback 한다", async () => {
    mockComputeTurnChanges.mockReturnValue(null);
    mockGitDirtySrcHashes.mockReturnValue({ "src/actions/order.ts": "abc" });
    mockInspect.mockResolvedValue(enforcedTarget());
    mockRunSiblings.mockReturnValue({ green: true, failures: [] });

    await checkBeforeStop({ sessionId: "no-turn-file", stopHookActive: false });
    expect(mockInspect).toHaveBeenCalledWith("src/actions/order.ts");
  });

  it("검사할 게 없으면 그대로 통과시킨다", async () => {
    const result = await checkBeforeStop({
      sessionId: "empty",
      stopHookActive: false,
    });
    expect(result).toBeNull();
  });
});

describe("recordEdits / recordTurnStart", () => {
  it("enforced 대상만 turnFile에 기록한다", async () => {
    mockInspect
      .mockResolvedValueOnce(enforcedTarget())
      .mockResolvedValueOnce({ enforced: false });

    await recordEdits(
      [
        { path: "src/actions/order.ts", op: "update" },
        { path: "src/core/domain/error.ts", op: "update" },
      ],
      "s1",
    );

    expect(fs.readFileSync(turnFilePath, "utf8")).toBe(
      "src/actions/order.ts\n",
    );
  });

  it("recordTurnStart는 세션 스냅샷을 기록한다", () => {
    recordTurnStart("s1");
    expect(mockWriteTurnSnapshot).toHaveBeenCalledWith("s1");
  });
});
