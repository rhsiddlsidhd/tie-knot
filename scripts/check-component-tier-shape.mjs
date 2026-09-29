// src/ui/components/AGENTS.md: ui와 atoms는 flat 구조를 유지하고, molecules/organisms/templates는
// 컴포넌트마다 동일 이름 디렉토리(`{Component}/{Component}.tsx`)를 둔다.
//
// eslint-plugin-check-file은 이름 케이스만 검사하고 "이 파일이 여기 직접 있으면 안 된다"는
// 위치 자체는 검사하지 못한다. 이 스크립트가 그 구조 불변식을 검사한다.
import fs from "node:fs";
import path from "node:path";

const COMPONENTS = path.join(process.cwd(), "src", "ui", "components");
const FLAT_TIERS = ["ui", "atoms"];
const NESTED_TIERS = ["molecules", "organisms", "templates"];

const problems = [];

for (const tier of FLAT_TIERS) {
  const dir = path.join(COMPONENTS, tier);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      problems.push(
        `src/ui/components/${tier}/${entry.name}/ — ${tier}는 하위 폴더를 두지 않는다`,
      );
    }
  }
}

for (const tier of NESTED_TIERS) {
  const dir = path.join(COMPONENTS, tier);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      problems.push(
        `src/ui/components/${tier}/${entry.name} — 컴포넌트별 디렉토리(${tier}/{Component}/{Component}.tsx) 없이 파일이 티어 루트에 직접 있다`,
      );
    }
  }
}

if (problems.length > 0) {
  console.error(
    `컴포넌트 티어 구조 위반 ${problems.length}건 — src/ui/components/AGENTS.md\n`,
  );
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}

console.log(
  "컴포넌트 티어 구조 정상 — ui/atoms는 flat, molecules/organisms/templates는 컴포넌트별 디렉토리.",
);
