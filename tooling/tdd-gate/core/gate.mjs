import fs from "node:fs";

import {
  computeTurnChanges,
  ensureCacheDir,
  gitDirtySrcHashes,
  inspect,
  isFormattingOnlyChange,
  turnFile,
  writeTurnSnapshot,
} from "./resolver.mjs";
import { runSiblings } from "./run-tests.mjs";

/** @param {{path: string, op: "add"|"update"|"delete"}[]} paths */
async function checkBeforeEdit(paths, timeoutMs = 180_000) {
  for (const { path: filePath, op } of paths) {
    if (op === "delete") continue;

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

    const { green, failures } = runSiblings(siblings, timeoutMs);
    if (!green) {
      if (failures.some((failure) => failure.timedOut)) {
        return {
          action: "deny",
          reason: [
            `TDD gate: ${relPath} 의 형제 test 실행이 제한 시간을 초과해 red/green 을 판정할 수 없다.`,
            "",
            "sibling 범위를 줄이거나 tooling/tdd-gate/policy.json 의 exclude 를 검토해라.",
          ].join("\n"),
        };
      }
      continue;
    }

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

/** @param {{path: string, op: "add"|"update"|"delete"}[]} paths */
async function recordEdits(paths, sessionId) {
  const edited = [];
  for (const { path: filePath } of paths) {
    const target = await inspect(filePath);
    if (target.enforced) edited.push(target.relPath);
  }
  if (edited.length === 0) return;

  ensureCacheDir();
  fs.appendFileSync(turnFile(sessionId), `${edited.join("\n")}\n`);
}

function recordTurnStart(sessionId) {
  writeTurnSnapshot(sessionId);
}

async function checkBeforeStop(
  { sessionId, stopHookActive },
  timeoutMs = 300_000,
) {
  const file = turnFile(sessionId);

  let recorded;
  try {
    recorded = [
      ...new Set(fs.readFileSync(file, "utf8").split("\n").filter(Boolean)),
    ];
  } catch {
    recorded = [];
  }

  const gitChanged =
    computeTurnChanges(sessionId) ?? Object.keys(gitDirtySrcHashes());
  const edited = [...new Set([...recorded, ...gitChanged])];

  if (edited.length === 0) {
    fs.rmSync(file, { force: true });
    return null;
  }

  // exists === false(이번 턴에 삭제됨)인 대상은 검사하지 않는다 — 삭제엔 test가
  // 필요 없다. 존재하는데 sibling이 0개면 "test 없음"으로 즉시 문제 삼는다 — 여기서
  // 걸러내지 않으면 Bash 등 Pre를 거치지 않는 경로로 만든, test가 아예 없는 파일이
  // 형제 test 자체가 없다는 이유로 검사 대상에서 빠져 조용히 통과해버린다.
  const missingTest = [];
  const siblings = [];
  for (const relPath of edited) {
    if (await isFormattingOnlyChange(sessionId, relPath)) continue;
    const target = await inspect(relPath);
    if (!target.enforced || !target.exists) continue;
    if (target.siblings.length === 0) missingTest.push(relPath);
    else siblings.push(...target.siblings);
  }

  if (missingTest.length === 0 && siblings.length === 0) {
    fs.rmSync(file, { force: true });
    return null;
  }

  if (missingTest.length > 0) {
    return stopOutcome(stopHookActive, [
      "TDD gate: 이번 턴에 편집된 아래 파일에 대응하는 test 가 없다.",
      "",
      ...missingTest.map((relPath) => `- ${relPath}`),
      "",
      "test 를 먼저 쓰거나, test 대상이 아니면 tooling/tdd-gate/policy.json 의 exclude 에 추가해라.",
    ]);
  }

  const { green, failures } = runSiblings(dedupe(siblings), timeoutMs);
  if (green) {
    fs.rmSync(file, { force: true });
    return null;
  }

  return stopOutcome(stopHookActive, [
    "TDD gate: 이번 턴에 편집한 파일의 test 가 실패한다. green 을 만들고 끝내라.",
    "",
    ...failures.map(
      (failure) =>
        `[${failure.tier}] ${failure.paths.join(", ")}\n${failure.output}`,
    ),
  ]);
}

// stop_hook_active=true 는 이미 한 번 block 한 뒤의 재시도다 — 다시 block 하면
// harness 가 무한 루프를 막으려 강제한 재시도 계약을 어기게 된다. 여기서는 턴
// 종료를 허용하되 turnFile 을 지우지 않고 남겨 다음 턴 Stop 이 이어서 검사하게
// 한다("빚 이월"). 벗어나는 길은 green 을 만들거나 policy.json exclude 뿐이다.
function stopOutcome(stopHookActive, lines) {
  if (stopHookActive) {
    return {
      action: "warn",
      reason: [
        "TDD gate: 문제가 남은 채 턴이 종료된다. 다음 턴 Stop 에서 이어서 검사한다.",
        "",
        ...lines,
      ].join("\n"),
    };
  }
  return { action: "block", reason: lines.join("\n") };
}

function dedupe(siblings) {
  const seen = new Map();
  for (const sibling of siblings) seen.set(sibling.path, sibling);
  return [...seen.values()];
}

export { checkBeforeEdit, recordEdits, recordTurnStart, checkBeforeStop };
