import path from "node:path";

const DEFAULT_EXCLUDES = [
  /(^|\/)docs?\//,
  /\.stories\.[jt]sx?$/,
  /\.d\.ts$/,
  /\.(css|scss|sass|less)$/,
  /(^|\/)(generated|__generated__)\//,
  /(^|\/)testing\/support\//,
  /(^|\/)scripts\/e2e\/server\.mjs$/,
  /(^|\/)scripts\/tdd-guard\/adapters\/(?:claude|codex)\.mjs$/,
  /(^|\/)type\.ts$/,
  /(^|\/)(index)\.[jt]s$/,
  /(^|\/)(next|vitest|playwright|eslint|prettier)\.config\.[cm]?[jt]s$/,
];

export function normalizePath(file) {
  return file.split(path.sep).join("/").replace(/^\.\//, "");
}

export function isTestFile(file) {
  return /(?:^|\/)(?:testing\/e2e\/.*\.spec|.*\.(?:unit\.|integration\.)?test)\.(?:[jt]sx?|mjs)$/.test(
    normalizePath(file),
  );
}

export function classifyFile(file) {
  const normalized = normalizePath(file);
  if (isTestFile(normalized)) return { kind: "test", guarded: false };
  if (DEFAULT_EXCLUDES.some((pattern) => pattern.test(normalized))) {
    return { kind: "excluded", guarded: false };
  }
  // Guard가 상태 전이로 증명하는 대상은 제품 코드다. scripts는 그 증명을 수행하는 도구라
  // 같은 절차로 자기 자신을 통과시킬 수 없다 — 테스트는 `guard` project와 CI가 강제한다.
  if (/\.[cm]?[jt]sx?$/.test(normalized) && normalized.startsWith("src/")) {
    return { kind: "product", guarded: true };
  }
  return { kind: "excluded", guarded: false };
}
