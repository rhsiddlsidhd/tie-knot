// ADR-0004: src/ 안에 배럴(index.ts/index.tsx)을 두지 않는다.
//
// 배럴 파일이 없으면 `@/services` 같은 디렉터리 지정 import는 모듈 해석 단계에서
// 실패하므로 `npm run tsc`가 잡는다. 따라서 이 검사 하나로 두 규칙이 함께 강제된다.
import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "src");

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/^index\.tsx?$/.test(entry.name)) out.push(path.relative(process.cwd(), full));
  }
  return out;
};

const found = walk(SRC).sort();

if (found.length > 0) {
  console.error(
    `배럴 파일 ${found.length}개를 찾았다. src/ 안에는 index.ts/index.tsx를 두지 않는다.\n` +
      `심볼이 정의된 파일을 직접 지정해 import한다 — docs/decisions/0004-explicit-module-paths-over-barrels.md\n`,
  );
  found.forEach((f) => console.error(`  ${f}`));
  process.exit(1);
}

console.log("배럴 없음 — src/ 안에 index.ts/index.tsx가 없다.");
