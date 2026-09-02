import { describe, expect, it } from "vitest";

import { extractClaudePaths } from "./claude.mjs";
import { extractCodexPaths } from "./codex.mjs";

describe("TDD gate provider adapters", () => {
  it("Claude 편집 도구에서 단일 파일 경로를 추출한다", () => {
    expect(
      extractClaudePaths({
        tool_name: "Edit",
        tool_input: { file_path: "src/actions/order.ts" },
      }),
    ).toEqual(["src/actions/order.ts"]);
  });

  it("Claude 편집 도구가 아니면 경로를 반환하지 않는다", () => {
    expect(
      extractClaudePaths({
        tool_name: "Bash",
        tool_input: { file_path: "src/actions/order.ts" },
      }),
    ).toEqual([]);
  });

  it("Codex apply_patch에서 여러 작업의 경로를 순서대로 중복 없이 추출한다", () => {
    const command = [
      "*** Begin Patch",
      "*** Update File: src/actions/order.ts",
      "*** Move to: src/actions/order-new.ts",
      "*** Add File: src/actions/order.unit.test.ts",
      "*** Delete File: src/actions/order.ts",
      "*** End Patch",
    ].join("\n");

    expect(
      extractCodexPaths({ tool_name: "apply_patch", tool_input: { command } }),
    ).toEqual([
      "src/actions/order.ts",
      "src/actions/order-new.ts",
      "src/actions/order.unit.test.ts",
    ]);
  });

  it("Codex apply_patch가 아니거나 command가 없으면 경로를 반환하지 않는다", () => {
    expect(extractCodexPaths({ tool_name: "Bash" })).toEqual([]);
    expect(
      extractCodexPaths({ tool_name: "apply_patch", tool_input: {} }),
    ).toEqual([]);
  });
});
