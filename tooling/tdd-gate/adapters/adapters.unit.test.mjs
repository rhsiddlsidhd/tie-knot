import { describe, expect, it } from "vitest";

import { extractClaudePaths } from "./claude.mjs";
import { extractCodexPaths } from "./codex.mjs";

describe("TDD gate provider adapters", () => {
  it("Claude 편집 도구에서 단일 파일 경로를 update op으로 추출한다", () => {
    expect(
      extractClaudePaths({
        tool_name: "Edit",
        tool_input: { file_path: "src/actions/order.ts" },
      }),
    ).toEqual([{ path: "src/actions/order.ts", op: "update" }]);
  });

  it("Claude 편집 도구가 아니면 경로를 반환하지 않는다", () => {
    expect(
      extractClaudePaths({
        tool_name: "Bash",
        tool_input: { file_path: "src/actions/order.ts" },
      }),
    ).toEqual([]);
  });

  it("Codex apply_patch에서 Add/Update/Delete op을 각각 추출한다", () => {
    const command = [
      "*** Begin Patch",
      "*** Add File: src/actions/order.unit.test.ts",
      "*** Update File: src/actions/refund.ts",
      "*** Delete File: src/actions/legacy.ts",
      "*** End Patch",
    ].join("\n");

    expect(
      extractCodexPaths({ tool_name: "apply_patch", tool_input: { command } }),
    ).toEqual([
      { path: "src/actions/order.unit.test.ts", op: "add" },
      { path: "src/actions/refund.ts", op: "update" },
      { path: "src/actions/legacy.ts", op: "delete" },
    ]);
  });

  it("Move to 는 옛 경로를 delete, 새 경로를 add 로 가른다", () => {
    const command = [
      "*** Begin Patch",
      "*** Update File: src/actions/order.ts",
      "*** Move to: src/actions/order-new.ts",
      "*** End Patch",
    ].join("\n");

    expect(
      extractCodexPaths({ tool_name: "apply_patch", tool_input: { command } }),
    ).toEqual([
      { path: "src/actions/order.ts", op: "delete" },
      { path: "src/actions/order-new.ts", op: "add" },
    ]);
  });

  it("같은 경로가 여러 번 언급되면 마지막 op으로 덮어써 중복 없이 유지한다", () => {
    const command = [
      "*** Begin Patch",
      "*** Update File: src/actions/order.ts",
      "*** Delete File: src/actions/order.ts",
      "*** End Patch",
    ].join("\n");

    expect(
      extractCodexPaths({ tool_name: "apply_patch", tool_input: { command } }),
    ).toEqual([{ path: "src/actions/order.ts", op: "delete" }]);
  });

  it("Codex apply_patch가 아니거나 command가 없으면 경로를 반환하지 않는다", () => {
    expect(extractCodexPaths({ tool_name: "Bash" })).toEqual([]);
    expect(
      extractCodexPaths({ tool_name: "apply_patch", tool_input: {} }),
    ).toEqual([]);
  });
});
