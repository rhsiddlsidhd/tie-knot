// ADR-0004: src/ 안에 배럴(index.ts/index.tsx)을 두지 않는다.
// ADR-0007: 단, src/ui/components/{molecules,organisms,templates}/{Component}/index.ts는
// 같은 이름의 컴포넌트 파일 하나만 재수출하면 예외로 허용한다.
//
// 배럴 파일이 없으면 `@/services` 같은 디렉터리 지정 import는 모듈 해석 단계에서
// 실패하므로 `npm run tsc`가 잡는다. 따라서 이 검사 하나로 두 규칙이 함께 강제된다.
import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");
const EXEMPT_TIER_DIR = path.join(SRC, "ui", "components");
const EXEMPT_TIERS = new Set(["molecules", "organisms", "templates"]);

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/^index\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
};

// ADR-0007 불변식: `export { X } from "./{dirName}";` / `export type { Y } from "./{dirName}";`
// 형태의 문만 존재해야 한다 — 전부 같은 파일 하나만 가리키면 여러 문장(예: 값/타입 분리)도 허용한다.
// `export *`나 다른 경로로의 재수출, 그 밖의 문(import, 로직)은 허용하지 않는다.
const isValidComponentBarrel = (file) => {
  const dir = path.dirname(file);
  const parentDir = path.dirname(dir);
  const tier = path.basename(parentDir);
  if (path.dirname(parentDir) !== EXEMPT_TIER_DIR || !EXEMPT_TIERS.has(tier)) return false;

  const componentName = path.basename(dir);
  const content = fs.readFileSync(file, "utf8").trim();
  if (content.includes("export *")) return false;

  const statements = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (statements.length === 0) return false;

  const pattern = new RegExp(`^export\\s+(type\\s+)?\\{[^}]*\\}\\s*from\\s*["']\\./${componentName}["'];?$`);
  return statements.every((statement) => pattern.test(statement));
};

const found = walk(SRC).filter((file) => !isValidComponentBarrel(file)).sort();

if (found.length > 0) {
  console.error(
    `배럴 파일 ${found.length}개를 찾았다. src/ 안에는 index.ts/index.tsx를 두지 않는다.\n` +
      `심볼이 정의된 파일을 직접 지정해 import한다 — docs/decisions/0004-explicit-module-paths-over-barrels.md\n` +
      `단, 컴포넌트 디렉토리는 동일 이름 파일 하나만 재수출하는 배럴을 예외로 허용한다 — docs/decisions/0007-per-component-directory-barrel.md\n`,
  );
  found.forEach((f) => console.error(`  ${path.relative(process.cwd(), f)}`));
  process.exit(1);
}

console.log("배럴 없음 — src/ 안에 index.ts/index.tsx가 없거나 ADR-0007 예외만 존재한다.");
