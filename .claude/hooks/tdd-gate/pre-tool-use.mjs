#!/usr/bin/env node
/**
 * Lever A — PreToolUse(Write|Edit).
 *
 *   기존 파일 수정 → 형제 test 존재만 확인한다(TDD 3단계 refactor 는 green 에서 일어난다).
 *   신규 파일 생성 → 형제 test 존재 + 그 test 가 red 인지 확인한다(TDD 1단계).
 *
 * 예외·파싱 실패는 전부 fail-open 이다. 게이트 버그가 작업을 막으면 안 된다.
 */

import { inspect } from "./resolver.mjs";
import { runSiblings } from "./run-tests.mjs";

const DOCS = (tier) => `docs/__test/${tier}.md`;

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

async function main() {
  const payload = JSON.parse(await readStdin());
  if (!["Write", "Edit", "MultiEdit"].includes(payload.tool_name)) return;

  const filePath = payload.tool_input?.file_path;
  if (!filePath) return;

  const target = await inspect(filePath);
  if (!target.enforced) return;

  const { relPath, tier, recommended, siblings, exists } = target;

  if (siblings.length === 0) {
    // .tsx 도 config 가 허용할 때만 단서를 붙인다. adapters/browser 처럼 .ts 고정인
    // 자리에서는 잘못된 안내가 된다.
    const tsxAllowed = target.candidates.some((c) => c.suffix.endsWith(".tsx"));
    const jsxHint =
      recommended.suffix.endsWith(".ts") && tsxAllowed
        ? " JSX 래퍼가 필요하면 확장자를 .tsx 로 바꿔라."
        : "";
    deny(
      [
        `TDD gate: ${relPath} 에 대응하는 ${tier} test 가 없다.`,
        ``,
        `먼저 작성할 파일: ${recommended.path}`,
        `tier: ${tier} — 작성 규칙은 ${DOCS(tier)} 를 따른다.${jsxHint}`,
        ``,
        `test 를 먼저 쓰고 나서 이 편집을 다시 시도해라.`,
        `이 파일이 정말 test 대상이 아니라면 .claude/tdd-gate.json 의 exclude 에 추가해라.`,
      ].join("\n"),
    );
  }

  if (exists) return; // 기존 수정: 형제 test 존재만으로 통과

  const { green } = runSiblings(siblings);
  if (green) {
    deny(
      [
        `TDD gate: ${relPath} 는 신규 파일인데 형제 test 가 이미 통과한다.`,
        ``,
        `통과 중인 test: ${siblings.map((s) => s.path).join(", ")}`,
        `처음부터 통과하는 test 로는 새 파일을 정당화하지 못한다.`,
        `이 파일이 없으면 실패하는 test 를 먼저 추가해 red 를 만든 뒤 다시 시도해라.`,
      ].join("\n"),
    );
  }
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    process.stderr.write(`tdd-gate(pre-tool-use) fail-open: ${err?.stack ?? err}\n`);
    process.exit(0);
  });
