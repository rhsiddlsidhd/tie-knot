import fs from "node:fs";

import { ensureCacheDir, inspect, turnFile } from "./resolver.mjs";
import { runSiblings } from "./run-tests.mjs";

export async function checkBeforeEdit(paths) {
  for (const filePath of paths) {
    const target = await inspect(filePath);
    if (!target.enforced) continue;

    const { relPath, tier, recommended, siblings, exists } = target;
    if (siblings.length === 0) {
      const tsxAllowed = target.candidates.some((candidate) =>
        candidate.suffix.endsWith(".tsx"),
      );
      const jsxHint =
        recommended.suffix.endsWith(".ts") && tsxAllowed
          ? " JSX 래퍼가 필요하면 확장자를 .tsx 로 바꿔라."
          : "";
      return {
        action: "deny",
        reason: [
          `TDD gate: ${relPath} 에 대응하는 ${tier} test 가 없다.`,
          "",
          `먼저 작성할 파일: ${recommended.path}`,
          `tier: ${tier} — 작성 규칙은 docs/__test/${tier}.md 를 따른다.${jsxHint}`,
          "",
          "test 를 먼저 쓰고 나서 이 편집을 다시 시도해라.",
          "이 파일이 정말 test 대상이 아니라면 tooling/tdd-gate/policy.json 의 exclude 에 추가해라.",
        ].join("\n"),
      };
    }

    if (exists) continue;
    const { green } = runSiblings(siblings);
    if (!green) continue;

    return {
      action: "deny",
      reason: [
        `TDD gate: ${relPath} 는 신규 파일인데 형제 test 가 이미 통과한다.`,
        "",
        `통과 중인 test: ${siblings.map((sibling) => sibling.path).join(", ")}`,
        "처음부터 통과하는 test 로는 새 파일을 정당화하지 못한다.",
        "이 파일이 없으면 실패하는 test 를 먼저 추가해 red 를 만든 뒤 다시 시도해라.",
      ].join("\n"),
    };
  }

  return null;
}

export async function recordEdits(paths, sessionId) {
  const edited = [];
  for (const filePath of paths) {
    const target = await inspect(filePath);
    if (target.enforced) edited.push(target.relPath);
  }
  if (edited.length === 0) return;

  ensureCacheDir();
  fs.appendFileSync(turnFile(sessionId), `${edited.join("\n")}\n`);
}

export async function checkBeforeStop({ sessionId, stopHookActive }) {
  const file = turnFile(sessionId);

  let edited;
  try {
    edited = [
      ...new Set(fs.readFileSync(file, "utf8").split("\n").filter(Boolean)),
    ];
  } catch {
    return null;
  }

  if (stopHookActive) {
    fs.rmSync(file, { force: true });
    return null;
  }

  const siblings = [];
  for (const relPath of edited) {
    const target = await inspect(relPath);
    if (target.enforced) siblings.push(...target.siblings);
  }

  if (siblings.length === 0) {
    fs.rmSync(file, { force: true });
    return null;
  }

  const { green, failures } = runSiblings(dedupe(siblings));
  if (green) {
    fs.rmSync(file, { force: true });
    return null;
  }

  return {
    action: "block",
    reason: [
      "TDD gate: 이번 턴에 편집한 파일의 test 가 실패한다. green 을 만들고 끝내라.",
      "",
      ...failures.map(
        (failure) =>
          `[${failure.tier}] ${failure.paths.join(", ")}\n${failure.output}`,
      ),
    ].join("\n"),
  };
}

function dedupe(siblings) {
  const seen = new Map();
  for (const sibling of siblings) seen.set(sibling.path, sibling);
  return [...seen.values()];
}
