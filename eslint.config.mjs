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
        { target: "./src/core", from: "./src/models", message: "core는 순수해야 한다" },
        { target: "./src/core", from: "./src/services", message: "core는 순수해야 한다" },
        { target: "./src/core", from: "./src/db", message: "core는 순수해야 한다" },
        { target: "./src/core", from: "./src/adapters", message: "core는 순수해야 한다" },
        { target: "./src/core", from: "./src/actions", message: "core는 순수해야 한다" },
        { target: "./src/core", from: "./src/server", message: "core는 순수해야 한다" },
        { target: "./src/core", from: "./src/ui", message: "core는 순수해야 한다" },
        { target: "./src/core", from: "./src/app", message: "core는 순수해야 한다" },
        { target: "./src/models", from: "./src/ui", message: "모델은 UI를 모른다" },
        { target: "./src/services", from: "./src/ui", message: "서비스는 UI를 모른다" },
        { target: "./src/db", from: "./src/ui", message: "DB는 UI를 모른다" },
        { target: "./src/server", from: "./src/ui", message: "서버는 UI를 모른다" },
        { target: "./src/ui", from: "./src/models", message: "UI는 model을 직접 못 만진다" },
        { target: "./src/ui", from: "./src/services", message: "UI는 service를 직접 못 만진다" },
        { target: "./src/ui", from: "./src/db", message: "UI는 DB를 직접 못 만진다" },
        { target: "./src/actions", from: "./src/models", message: "action은 model을 직접 못 만진다" },
        { target: "./src/actions", from: "./src/db", message: "action은 DB를 직접 못 만진다" },
        { target: "./src/actions", from: "./src/adapters", message: "action은 adapter를 직접 못 만진다" },
        { target: "./src/services", from: "./src/actions", message: "서비스는 action을 모른다" },
      ],
    }],
  },
}, {
  files: ["src/core/**/*.{ts,tsx}"],
  ignores: [
    "src/core/**/*.test.ts",
    "src/core/**/*.test.tsx",
    "src/core/**/*.integration.test.ts",
    "src/core/**/*.integration.test.tsx",
  ],
  rules: {
    "import/no-nodejs-modules": "error",
    "no-restricted-imports": ["error", {
      paths: [
        { name: "mongoose", message: "core는 Mongoose에 의존하지 않는다" },
        { name: "next", message: "core는 Next.js에 의존하지 않는다" },
        { name: "server-only", message: "core는 runtime marker에 의존하지 않는다" },
        { name: "client-only", message: "core는 runtime marker에 의존하지 않는다" },
      ],
      patterns: [
        { group: ["mongoose/*"], message: "core는 Mongoose에 의존하지 않는다" },
        { group: ["next/*"], message: "core는 Next.js에 의존하지 않는다" },
      ],
    }],
  },
}, {
  files: ["src/actions/**/*.{ts,tsx}"],
  ignores: [
    "src/actions/**/*.test.ts",
    "src/actions/**/*.test.tsx",
    "src/actions/**/*.integration.test.ts",
    "src/actions/**/*.integration.test.tsx",
  ],
  rules: {
    "no-restricted-imports": ["error", {
      paths: [
        { name: "server-only", message: "action은 server-only marker를 사용하지 않는다" },
        { name: "client-only", message: "action은 client-only marker를 사용하지 않는다" },
      ],
    }],
  },
}, {
  files: ["src/actions/**/*.test.ts", "src/actions/**/*.integration.test.ts"],
  rules: {
    "import/no-restricted-paths": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "scripts/**", ".claude/hooks/**", "coverage/**", "docs/design/**"]
}];

export default eslintConfig;
