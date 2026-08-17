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
        { target: "./src/core", from: "./src/client", message: "core는 순수해야 한다" },
        { target: "./src/core", from: "./src/app", message: "core는 순수해야 한다" },
        { target: "./src/models", from: "./src/client", message: "모델은 클라이언트를 모른다" },
        { target: "./src/services", from: "./src/client", message: "서비스는 클라이언트를 모른다" },
        { target: "./src/db", from: "./src/client", message: "DB는 클라이언트를 모른다" },
        { target: "./src/server", from: "./src/client", message: "서버는 클라이언트를 모른다" },
        { target: "./src/actions", from: "./src/models", message: "action은 model을 직접 못 만진다" },
        { target: "./src/actions", from: "./src/db", message: "action은 DB를 직접 못 만진다" },
        { target: "./src/services", from: "./src/actions", message: "서비스는 action을 모른다" },
      ],
    }],
  },
}, {
  files: ["src/actions/**/*.test.ts", "src/actions/**/*.integration.test.ts"],
  rules: {
    "import/no-restricted-paths": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "scripts/**", ".claude/hooks/**", "coverage/**"]
}];

export default eslintConfig;
