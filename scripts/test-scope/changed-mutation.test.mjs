import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  escapeGlobPath,
  evaluateReport,
  mutationPlan,
} from "./changed-mutation.mjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "changed-mutation-"));
  fs.writeFileSync(
    path.join(root, "tsconfig.json"),
    JSON.stringify({ compilerOptions: { moduleResolution: "Bundler" } }),
  );
  fs.mkdirSync(path.join(root, "src"));
  fs.writeFileSync(
    path.join(root, "src/value.ts"),
    "export const value = 1;\n",
  );
  fs.writeFileSync(
    path.join(root, "src/value.test.ts"),
    'import { value } from "./value"; void value;\n',
  );
  execFileSync("git", ["init", "-b", "dev"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], {
    cwd: root,
  });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "baseline"], { cwd: root });
  execFileSync("git", ["branch", "baseline"], { cwd: root });
  return root;
}

describe("changed mutation plan", () => {
  it.each([
    [
      "라우트 그룹",
      "src/app/(main)/page.tsx:1-1",
      "src/app/\\(main\\)/page.tsx:1-1",
    ],
    [
      "동적 세그먼트",
      "src/app/[id]/page.tsx:3-3",
      "src/app/\\[id\\]/page.tsx:3-3",
    ],
    [
      "라우트 그룹과 동적 세그먼트",
      "src/app/(preview)/preview/[id]/_components/Navigation.tsx:3-3",
      "src/app/\\(preview\\)/preview/\\[id\\]/_components/Navigation.tsx:3-3",
    ],
  ])(
    "Stryker에 전달할 %s 경로만 glob escape한다",
    (_name, target, expected) => {
      expect(escapeGlobPath(target)).toBe(expected);
    },
  );

  it("라우트 경로의 plan.targets와 sourceHash는 escape되지 않은 원본을 유지한다", () => {
    const root = fixture();
    const source = "src/app/(preview)/preview/[id]/_components/Navigation.tsx";
    const test =
      "src/app/(preview)/preview/[id]/_components/Navigation.test.tsx";
    fs.mkdirSync(path.dirname(path.join(root, source)), { recursive: true });
    fs.writeFileSync(path.join(root, source), "export const navigation = 1;\n");
    fs.writeFileSync(
      path.join(root, test),
      'import { navigation } from "./Navigation"; void navigation;\n',
    );
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-m", "route baseline"], { cwd: root });
    execFileSync("git", ["branch", "-f", "baseline", "HEAD"], { cwd: root });
    fs.writeFileSync(path.join(root, source), "export const navigation = 2;\n");
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-m", "change route"], { cwd: root });

    const plan = mutationPlan(root, "baseline");
    const target = `${source}:1-1`;
    const expectedHash = crypto
      .createHash("sha256")
      .update(`${target}\0${fs.readFileSync(path.join(root, source))}`)
      .digest("hex");

    expect(plan.targets).toEqual([target]);
    expect(plan.sourceHash).toBe(expectedHash);
  });

  it("merge-base 이후 바뀐 제품 줄과 관련 테스트만 선택한다", () => {
    const root = fixture();
    fs.writeFileSync(
      path.join(root, "src/value.ts"),
      "export const value = 2;\nexport const next = 3;\n",
    );
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-m", "change"], { cwd: root });
    expect(mutationPlan(root, "baseline")).toMatchObject({
      targets: ["src/value.ts:1-2"],
      tests: ["src/value.test.ts"],
    });
  });

  it("sourceHash는 반환된 targets(정렬됨)와 같은 순서로 계산된다 — 한 자리/두 자리 줄번호가 섞여도 어긋나지 않는다", () => {
    const root = fixture();
    const lines = Array.from(
      { length: 25 },
      (_, i) => `export const v${i} = ${i};`,
    );
    fs.writeFileSync(path.join(root, "src/value.ts"), `${lines.join("\n")}\n`);
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-m", "multiline baseline"], { cwd: root });
    execFileSync("git", ["branch", "-f", "baseline", "HEAD"], { cwd: root });

    // 7번째 줄과 21번째 줄을 각각 별도 hunk로 바꾼다 — 문자열 정렬("21-21" < "7-7")과
    // 실제 diff 등장 순서(7번째 줄이 21번째 줄보다 먼저)가 어긋나는 상황을 재현한다.
    lines[6] = "export const v6 = 999;";
    lines[20] = "export const v20 = 999;";
    fs.writeFileSync(path.join(root, "src/value.ts"), `${lines.join("\n")}\n`);
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-m", "change"], { cwd: root });

    const plan = mutationPlan(root, "baseline");
    const recomputed = crypto
      .createHash("sha256")
      .update(
        plan.targets
          .map((target) => {
            const file = target.slice(0, target.lastIndexOf(":"));
            return `${target}\0${fs.readFileSync(path.join(root, file))}`;
          })
          .join("\0"),
      )
      .digest("hex");

    expect(plan.targets).toEqual(["src/value.ts:21-21", "src/value.ts:7-7"]);
    expect(plan.sourceHash).toBe(recomputed);
  });

  it("mutant가 없으면 실패가 아니라 N/A다", () => {
    expect(evaluateReport({ files: {} })).toMatchObject({
      status: "N/A",
      total: 0,
    });
  });

  it("명시한 동등 mutant만 survived 예외로 인정한다", () => {
    const report = {
      files: {
        "src/value.ts": {
          mutants: [
            {
              status: "Survived",
              mutatorName: "BooleanLiteral",
              location: { start: { line: 4 } },
            },
          ],
        },
      },
    };
    expect(evaluateReport(report).status).toBe("FAILED");
    expect(
      evaluateReport(report, [
        { file: "src/value.ts", mutant: "4:BooleanLiteral" },
      ]).status,
    ).toBe("PASSED");
  });
});
