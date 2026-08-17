import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", fixStyle: "separate-type-imports" }],
  },
}, {
  files: ["src/**/*.{ts,tsx}"],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    "@typescript-eslint/consistent-type-exports": "error",
    "import/no-restricted-paths": ["error", {
      zones: [
        { target: "./src/shared", from: "./src/server", message: "shared는 순수해야 한다" },
        { target: "./src/shared", from: "./src/client", message: "shared는 순수해야 한다" },
        { target: "./src/shared", from: "./src/app", message: "shared는 순수해야 한다" },
        { target: "./src/server", from: "./src/client", message: "서버는 클라이언트를 모른다" },
        { target: "./src/client", from: "./src/server/lib", message: "UI는 서버 lib을 직접 못 만진다" },
        { target: "./src/client", from: "./src/server/services", message: "UI는 service 내부 타입을 직접 못 쓴다" },
        { target: "./src/client", from: "./src/server/models", message: "UI는 DB 스키마를 직접 못 쓴다" },
      ],
    }],
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "scripts/**", ".claude/hooks/**", "coverage/**"]
}];

export default eslintConfig;
