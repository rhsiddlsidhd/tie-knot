import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "./classify-file.mjs";
import { runtimeSpecifiers } from "../../test-scope/test-graph.mjs";

export function classifyScope(file) {
  const normalized = normalizePath(file);
  if (/^testing\/e2e\/.*\.spec\.[jt]s$/.test(normalized)) return "e2e";
  if (/\.integration\.test\.[jt]sx?$/.test(normalized)) {
    return "integration";
  }
  return "unit";
}

// 경계는 실제 런타임 import로 판정한다. 소스 텍스트 검사는 import로 표현되지 않는
// 두 경우(`use server` 지시문, 직접 fetch 호출)에만 남긴다.
const INTEGRATION_BOUNDARIES = [
  { modules: /^(?:mongoose|mongodb|mongodb-memory-server)$/, reason: "Mongoose/MongoDB 실행 경계 변경" },
  { modules: /^next\/server$/, source: /^\s*["']use server["']\s*;?\s*$/m, reason: "Server Action 또는 Route Handler 실행 경계 변경" },
  { modules: /^(?:swr|msw)$/, source: /\bfetch\s*\(/, reason: "실제 client HTTP 경계 변경" },
  { modules: /^(?:cloudinary(?:\/|$)|@portone\/)/, reason: "외부 서비스 adapter 경계 변경" },
];

// type-only import는 런타임에 남지 않으므로 의존으로 세지 않는다. 정규식으로 import를
// 긁으면 그 구분이 불가능해 요구 scope가 부풀어 오른다.
function moduleFacts(root, file) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return null;
  const source = fs.readFileSync(absolute, "utf8");
  try {
    return { source, specifiers: runtimeSpecifiers(source, file) };
  } catch {
    return { source, specifiers: [] };
  }
}

function localDependencies(root, file, specifiers) {
  const dependencies = [];
  for (const specifier of specifiers) {
    let candidate;
    if (specifier.startsWith("@/")) candidate = `src/${specifier.slice(2)}`;
    else if (specifier.startsWith(".")) candidate = normalizePath(path.join(path.dirname(file), specifier));
    if (!candidate) continue;
    for (const suffix of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
      const resolved = `${candidate}${suffix}`;
      const absolute = path.join(root, resolved);
      if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) { dependencies.push(resolved); break; }
    }
  }
  return dependencies;
}

export function requiredScopePolicy(files, root = process.cwd()) {
  const scopes = new Set();
  const reasons = {};
  const pending = files.map(normalizePath);
  const seen = new Set();
  for (const file of files) {
    if (/\.[cm]?[jt]sx?$/.test(file)) {
      scopes.add("unit");
      reasons.unit ??= "변경된 공개 계약을 격리해 검증";
    }
  }
  while (pending.length) {
    const file = pending.pop();
    if (!file || seen.has(file)) continue;
    seen.add(file);
    const facts = moduleFacts(root, file);
    if (!facts) continue;
    const boundary = INTEGRATION_BOUNDARIES.find(({ modules, source }) =>
      facts.specifiers.some((specifier) => modules.test(specifier)) || (source ? source.test(facts.source) : false));
    if (boundary) {
      scopes.add("integration");
      reasons.integration ??= boundary.reason;
    }
    pending.push(...localDependencies(root, file, facts.specifiers));
  }
  return { requiredScopes: [...scopes].sort(), reasons };
}

export function requiredScopes(files, root = process.cwd()) {
  return requiredScopePolicy(files, root).requiredScopes;
}
