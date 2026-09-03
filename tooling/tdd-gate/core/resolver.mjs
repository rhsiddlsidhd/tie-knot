/**
 * TDD gate resolver.
 *
 * 게이트는 판단하지 않는다. 이미 선언된 사실만 읽는다.
 *   - vitest.config.ts 의 project include/exclude → 어떤 test 경로가 어느 tier에 속하는가
 *   - tooling/tdd-gate/policy.json 의 exclude  → 어떤 소스가 강제 대상 밖인가
 *   - 파일 존재 여부                              → 형제 test 가 이미 있는가
 *
 * 새 규칙을 여기에 발명하지 마라. 예외가 필요하면 tooling/tdd-gate/policy.json 에 적는다.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import picomatch from "picomatch";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..", "..", "..");

const VITEST_CONFIG = path.join(ROOT, "vitest.config.ts");
const TSCONFIG = path.join(ROOT, "tsconfig.json");
const POLICY_FILE = path.join(ROOT, "tooling", "tdd-gate", "policy.json");

export const CACHE_DIR = path.join(ROOT, "node_modules", ".cache", "tdd-gate");
const CONFIG_CACHE = path.join(CACHE_DIR, "projects.json");

/** 게이트가 다루는 tier. integration 은 test/ 아래 별도 트리라 형제 매핑 밖이다. */
const GATE_TIERS = ["unit", "component"];

const TEST_FILE_RE = /\.(unit|component|integration)\.test\.tsx?$/;

/** 이번 턴에 편집된 강제 대상 경로 기록. PostToolUse 가 쓰고 Stop 이 소비한다. */
export function turnFile(sessionId) {
  const safe = String(sessionId ?? "unknown").replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(CACHE_DIR, `turn-${safe}.txt`);
}

export function ensureCacheDir() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export function toPosix(p) {
  return p.split(path.sep).join("/");
}

/** 절대경로·상대경로·`@/`·`@test/` 를 전부 repo 루트 기준 posix 상대경로로 정규화한다. */
export function toRelative(filePath) {
  if (!filePath) return null;
  const aliased = expandAlias(filePath);
  const abs = path.isAbsolute(aliased) ? aliased : path.resolve(ROOT, aliased);
  const rel = path.relative(ROOT, abs);
  if (!rel || rel.startsWith("..")) return null;
  return toPosix(rel);
}

let aliasCache = null;

/** tsconfig.json 의 paths 가 alias 의 원본이다. */
function loadAliases() {
  if (aliasCache) return aliasCache;
  const entries = [];
  try {
    const raw = fs.readFileSync(TSCONFIG, "utf8");
    const paths =
      JSON.parse(stripJsonComments(raw))?.compilerOptions?.paths ?? {};
    for (const [pattern, targets] of Object.entries(paths)) {
      if (!pattern.endsWith("/*") || !targets?.[0]?.endsWith("/*")) continue;
      entries.push({
        prefix: pattern.slice(0, -1),
        target: targets[0].slice(0, -1).replace(/^\.\//, ""),
      });
    }
  } catch {
    // fail-open: alias 를 못 읽어도 절대·상대 경로는 그대로 처리된다.
  }
  aliasCache = entries;
  return entries;
}

function expandAlias(p) {
  for (const { prefix, target } of loadAliases()) {
    if (p.startsWith(prefix)) return target + p.slice(prefix.length);
  }
  return p;
}

function stripJsonComments(raw) {
  return raw
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

export function isTestFile(relPath) {
  return TEST_FILE_RE.test(relPath);
}

/** tooling/tdd-gate/policy.json — 강제 대상에서 뺄 소스 glob. 없으면 빈 목록(fail-open). */
export function loadExcludes() {
  try {
    const parsed = JSON.parse(fs.readFileSync(POLICY_FILE, "utf8"));
    return Array.isArray(parsed?.exclude) ? parsed.exclude : [];
  } catch {
    return [];
  }
}

/**
 * vitest.config.ts 의 unit·component project 에서 include/exclude 만 뽑는다.
 * 로드가 196ms 라 mtime 으로 캐시한다.
 */
export async function loadProjects() {
  const mtimeMs = fs.statSync(VITEST_CONFIG).mtimeMs;

  try {
    const cached = JSON.parse(fs.readFileSync(CONFIG_CACHE, "utf8"));
    if (cached.mtimeMs === mtimeMs) return cached.projects;
  } catch {
    // 캐시 부재·손상은 정상 경로다. 다시 읽는다.
  }

  const { loadConfigFromFile } = await import("vite");
  const loaded = await loadConfigFromFile(
    { command: "serve", mode: "test" },
    VITEST_CONFIG,
    ROOT,
    "silent",
  );

  const projects = (loaded?.config?.test?.projects ?? [])
    .map((entry) => entry?.test)
    .filter((t) => t && GATE_TIERS.includes(t.name))
    .map((t) => ({
      name: t.name,
      include: t.include ?? [],
      // exclude 를 선언한 project 는 vitest 기본값을 대체한다. 여기서 기본값이
      // 하는 일은 node_modules 류 배제뿐이라 src 후보 판정에는 영향이 없다.
      exclude: t.exclude ?? [],
    }));

  try {
    ensureCacheDir();
    fs.writeFileSync(CONFIG_CACHE, JSON.stringify({ mtimeMs, projects }));
  } catch {
    // 캐시 저장 실패는 판정에 영향이 없다.
  }

  return projects;
}

function matchesAny(globs, relPath) {
  return globs.some((g) => picomatch.isMatch(relPath, g, { dot: true }));
}

/**
 * 소스 경로 하나에 대해 config 가 허용하는 형제 test 후보를 뽑는다.
 * 후보를 만들어 picomatch 에 물을 뿐, tier 규칙을 발명하지 않는다.
 */
export async function resolveCandidates(relPath) {
  const projects = await loadProjects();
  const base = relPath.replace(/\.[^./]+$/, "");
  const suffixes = ["unit.test.ts", "component.test.ts", "component.test.tsx"];

  const candidates = [];
  for (const suffix of suffixes) {
    const testPath = `${base}.${suffix}`;
    for (const project of projects) {
      if (!matchesAny(project.include, testPath)) continue;
      if (matchesAny(project.exclude, testPath)) continue;
      candidates.push({ path: testPath, tier: project.name, suffix });
    }
  }
  return candidates;
}

/**
 * 권장 test 경로: 소스 확장자를 승계한다(.ts→.ts, .tsx→.tsx).
 * 승계한 확장자가 config 에서 허용되지 않으면 허용되는 유일값으로 떨어진다
 * (예: adapters/browser 는 .ts 고정).
 */
export function recommend(relPath, candidates) {
  if (candidates.length === 0) return null;
  const ext = path.extname(relPath).replace(".", "");
  return candidates.find((c) => c.suffix.endsWith(`.${ext}`)) ?? candidates[0];
}

/** `<base>.<suffix>` 와 `<base>.<관점>.<suffix>` 를 둘 다 형제로 인정한다. */
export function findSiblings(relPath, candidates) {
  const base = relPath.replace(/\.[^./]+$/, "");
  const dir = path.posix.dirname(base);
  const stem = path.posix.basename(base);

  let entries;
  try {
    entries = fs.readdirSync(path.join(ROOT, dir));
  } catch {
    return [];
  }

  const allowed = new Set(candidates.map((c) => c.suffix));
  const tierOf = new Map(candidates.map((c) => [c.suffix, c.tier]));
  const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `^${escaped}(?:\\.[^.]+)?\\.((?:unit|component)\\.test\\.tsx?)$`,
  );

  const found = [];
  for (const entry of entries) {
    const m = re.exec(entry);
    if (!m || !allowed.has(m[1])) continue;
    found.push({ path: path.posix.join(dir, entry), tier: tierOf.get(m[1]) });
  }
  return found;
}

/**
 * 강제 대상 판정. 아래 4조건을 전부 만족해야 게이트가 개입한다.
 *   src/ 안 · test 파일 아님 · policy exclude 아님 · config 가 형제 test 를 허용함
 */
export async function inspect(filePath) {
  const relPath = toRelative(filePath);
  if (!relPath)
    return { relPath: null, enforced: false, reason: "outside-repo" };
  if (!relPath.startsWith("src/"))
    return { relPath, enforced: false, reason: "outside-src" };
  if (isTestFile(relPath))
    return { relPath, enforced: false, reason: "test-file" };
  if (matchesAny(loadExcludes(), relPath)) {
    return { relPath, enforced: false, reason: "policy-excluded" };
  }

  const candidates = await resolveCandidates(relPath);
  if (candidates.length === 0) {
    return { relPath, enforced: false, reason: "no-tier", candidates };
  }

  const tiers = [...new Set(candidates.map((c) => c.tier))];
  return {
    relPath,
    enforced: true,
    candidates,
    tiers,
    tier: tiers[0],
    recommended: recommend(relPath, candidates),
    siblings: findSiblings(relPath, candidates),
    exists: fs.existsSync(path.join(ROOT, relPath)),
  };
}
