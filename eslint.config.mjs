import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import checkFile from "eslint-plugin-check-file";

const TYPE_NAMING_CONVENTIONS = [
  {
    selector: ["typeAlias", "interface", "class", "enum", "enumMember"],
    format: ["PascalCase"],
    custom: { regex: "[A-Z]{2,}", match: false },
  },
  {
    selector: "typeParameter",
    format: ["PascalCase"],
  },
];

const CAMEL_CASE_FUNCTION = {
  selector: "variable",
  types: ["function"],
  format: ["camelCase"],
};

const PASCAL_CASE_EXPORTED_FUNCTION = {
  selector: "variable",
  modifiers: ["exported"],
  types: ["function"],
  format: ["PascalCase"],
};

const HOOK_FUNCTION = {
  selector: "variable",
  modifiers: ["exported"],
  types: ["function"],
  format: ["camelCase"],
  custom: { regex: "^use[A-Z]", match: true },
};

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportNamedDeclaration[declaration!=null]",
          message:
            "선언과 export를 분리하라 — 파일 끝에 export { X } 형태로 모아라. docs/decisions/0009-project-wide-list-style-named-exports.md",
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        ...TYPE_NAMING_CONVENTIONS,
      ],
      "import/no-default-export": "error",
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/core",
              from: "./src/models",
              message: "core는 순수해야 한다",
            },
            {
              target: "./src/core",
              from: "./src/services",
              message: "core는 순수해야 한다",
            },
            {
              target: "./src/core",
              from: "./src/db",
              message: "core는 순수해야 한다",
            },
            {
              target: "./src/core",
              from: "./src/adapters",
              message: "core는 순수해야 한다",
            },
            {
              target: "./src/core",
              from: "./src/actions",
              message: "core는 순수해야 한다",
            },
            {
              target: "./src/core",
              from: "./src/server",
              message: "core는 순수해야 한다",
            },
            {
              target: "./src/core",
              from: "./src/ui",
              message: "core는 순수해야 한다",
            },
            {
              target: "./src/core",
              from: "./src/app",
              message: "core는 순수해야 한다",
            },
            {
              target: "./src/models",
              from: "./src/ui",
              message: "모델은 UI를 모른다",
            },
            {
              target: "./src/services",
              from: "./src/ui",
              message: "서비스는 UI를 모른다",
            },
            {
              target: "./src/db",
              from: "./src/ui",
              message: "DB는 UI를 모른다",
            },
            {
              target: "./src/server",
              from: "./src/ui",
              message: "서버는 UI를 모른다",
            },
            {
              target: "./src/ui",
              from: "./src/models",
              message: "UI는 model을 직접 못 만진다",
            },
            {
              target: "./src/ui",
              from: "./src/services",
              message: "UI는 service를 직접 못 만진다",
            },
            {
              target: "./src/ui",
              from: "./src/db",
              message: "UI는 DB를 직접 못 만진다",
            },
            {
              target: "./src/actions",
              from: "./src/models",
              message: "action은 model을 직접 못 만진다",
            },
            {
              target: "./src/actions",
              from: "./src/db",
              message: "action은 DB를 직접 못 만진다",
            },
            {
              target: "./src/actions",
              from: "./src/adapters",
              message: "action은 adapter를 직접 못 만진다",
            },
            {
              target: "./src/services",
              from: "./src/actions",
              message: "서비스는 action을 모른다",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/core/domain/**/*.{ts,tsx}"],
    ignores: ["src/core/domain/**/*.test.ts", "src/core/domain/**/*.test.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        ...TYPE_NAMING_CONVENTIONS,
        {
          selector: "variable",
          modifiers: ["exported"],
          format: ["UPPER_CASE"],
        },
      ],
    },
  },
  {
    files: [
      "src/actions/**/*.{ts,tsx}",
      "src/services/**/*.{ts,tsx}",
      "src/core/utils/**/*.{ts,tsx}",
      "src/adapters/server/**/*.{ts,tsx}",
      "src/adapters/browser/{clipboard,deeplink,geolocation,portone}/**/*.{ts,tsx}",
      "src/ui/stores/app.store.ts",
      "src/ui/stores/slices/**/*.{ts,tsx}",
      "src/ui/context/createStateContext.tsx",
      "src/ui/context/**/reducer.ts",
      "src/app/**/_utils/**/*.{ts,tsx}",
    ],
    ignores: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        ...TYPE_NAMING_CONVENTIONS,
        CAMEL_CASE_FUNCTION,
      ],
    },
  },
  {
    files: [
      "src/ui/hooks/**/*.{ts,tsx}",
      "src/app/**/_hooks/**/*.{ts,tsx}",
      "src/ui/stores/use-app-store.ts",
      "src/adapters/browser/**/use*.{ts,tsx}",
    ],
    ignores: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        ...TYPE_NAMING_CONVENTIONS,
        HOOK_FUNCTION,
        CAMEL_CASE_FUNCTION,
      ],
    },
  },
  {
    files: [
      "src/ui/components/{molecules,organisms,templates}/**/*.{ts,tsx}",
      "src/app/**/_components/**/*.{ts,tsx}",
      "src/app/**/_containers/**/*.{ts,tsx}",
      "src/adapters/browser/cloudinary/widget.tsx",
    ],
    ignores: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        ...TYPE_NAMING_CONVENTIONS,
        PASCAL_CASE_EXPORTED_FUNCTION,
        {
          selector: "variable",
          types: ["function"],
          format: ["camelCase", "PascalCase"],
        },
      ],
    },
  },
  {
    files: ["src/ui/stores/provider.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        ...TYPE_NAMING_CONVENTIONS,
        {
          selector: "variable",
          modifiers: ["exported"],
          format: ["PascalCase"],
        },
      ],
    },
  },
  {
    files: ["src/ui/context/createStateContext.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        ...TYPE_NAMING_CONVENTIONS,
        {
          selector: "variable",
          types: ["function"],
          format: ["camelCase", "PascalCase"],
        },
      ],
    },
  },
  {
    files: ["src/ui/context/**/provider.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        ...TYPE_NAMING_CONVENTIONS,
        {
          selector: "variable",
          modifiers: ["exported"],
          types: ["function"],
          format: ["camelCase", "PascalCase"],
        },
      ],
    },
  },
  {
    files: ["src/core/schemas/**/*.{ts,tsx}", "src/models/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        ...TYPE_NAMING_CONVENTIONS,
        {
          selector: "variable",
          filter: { regex: "[Ss]chema$", match: true },
          format: ["PascalCase"],
        },
        {
          selector: "variable",
          filter: { regex: "[Mm]odel$", match: true },
          format: ["PascalCase"],
        },
        CAMEL_CASE_FUNCTION,
      ],
    },
  },
  {
    files: ["src/core/**/*.{ts,tsx}"],
    ignores: ["src/core/**/*.unit.test.ts", "src/core/**/*.unit.test.tsx"],
    rules: {
      "import/no-nodejs-modules": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "mongoose", message: "core는 Mongoose에 의존하지 않는다" },
            { name: "next", message: "core는 Next.js에 의존하지 않는다" },
            {
              name: "server-only",
              message: "core는 runtime marker에 의존하지 않는다",
            },
            {
              name: "client-only",
              message: "core는 runtime marker에 의존하지 않는다",
            },
          ],
          patterns: [
            {
              group: ["mongoose/*"],
              message: "core는 Mongoose에 의존하지 않는다",
            },
            { group: ["next/*"], message: "core는 Next.js에 의존하지 않는다" },
          ],
        },
      ],
    },
  },
  {
    files: ["src/actions/**/*.{ts,tsx}"],
    ignores: [
      "src/actions/**/*.unit.test.ts",
      "src/actions/**/*.unit.test.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message: "action은 server-only marker를 사용하지 않는다",
            },
            {
              name: "client-only",
              message: "action은 client-only marker를 사용하지 않는다",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/_components/**/*.{ts,tsx}"],
    ignores: [
      "src/app/**/_components/**/*.test.ts",
      "src/app/**/_components/**/*.test.tsx",
    ],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/actions/*"],
              allowTypeImports: true,
              message:
                "Server Action을 결합하는 컴포넌트는 _components가 아니라 동급 _containers에 둔다 — src/app/AGENTS.md §Structure",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/actions/**/*.unit.test.ts"],
    rules: {
      "import/no-restricted-paths": "off",
    },
  },
  {
    // atoms는 shadcn/Radix 컨벤션(kebab-case 파일명) 예외, molecules/organisms/templates는
    // 컴포넌트별 디렉토리(PascalCase)와 파일명이 일치해야 한다 — src/ui/components/AGENTS.md
    files: ["src/ui/components/**/*.{ts,tsx}"],
    plugins: {
      "check-file": checkFile,
    },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        {
          "src/ui/components/atoms/*.{ts,tsx}": "KEBAB_CASE",
          "src/ui/components/{molecules,organisms,templates}/*/!(index).{ts,tsx}":
            "<1>",
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
      "check-file/folder-naming-convention": [
        "error",
        {
          "src/ui/components/molecules/*/": "PASCAL_CASE",
          "src/ui/components/organisms/*/": "PASCAL_CASE",
          "src/ui/components/templates/*/": "PASCAL_CASE",
        },
      ],
    },
  },
  {
    // Next.js 파일 컨벤션이 요구하는 export default만 허용한다 — src/app/AGENTS.md, docs/decisions/0006-named-exports-over-default.md
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/loading.tsx",
      "src/app/**/error.tsx",
      "src/app/global-error.tsx",
      "src/app/**/not-found.tsx",
      "src/app/global-not-found.tsx",
      "src/app/**/template.tsx",
      "src/app/**/default.tsx",
      "src/app/**/forbidden.tsx",
      "src/app/**/unauthorized.tsx",
      "src/app/**/icon*.tsx",
      "src/app/**/apple-icon*.tsx",
      "src/app/**/opengraph-image.tsx",
      "src/app/**/twitter-image.tsx",
      "src/app/**/manifest.ts",
      "src/app/**/robots.ts",
      "src/app/**/sitemap.ts",
    ],
    rules: {
      "import/no-default-export": "off",
    },
  },
  {
    // Next.js는 route segment config를 직접 export한 const 선언에서 정적으로 추출한다.
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/route.ts",
      "src/app/**/icon*.tsx",
      "src/app/**/apple-icon*.tsx",
      "src/app/**/opengraph-image.tsx",
      "src/app/**/twitter-image.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ExportNamedDeclaration[declaration!=null]:not(:has(VariableDeclarator[id.name=/^(dynamic|dynamicParams|fetchCache|maxDuration|preferredRegion|revalidate|runtime|unstable_instant)$/]))",
          message:
            "선언과 export를 분리하라 — Next.js가 정적으로 분석하는 route segment config만 inline export가 허용된다. docs/decisions/0009-project-wide-list-style-named-exports.md",
        },
      ],
    },
  },
  {
    // Proxy matcher config도 직접 export한 const 선언이어야 build-time 정적 분석이 가능하다.
    files: ["src/proxy.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "ExportNamedDeclaration[declaration!=null]:not(:has(VariableDeclarator[id.name='config']))",
          message:
            "선언과 export를 분리하라 — Next.js가 정적으로 분석하는 proxy config만 inline export가 허용된다. docs/decisions/0009-project-wide-list-style-named-exports.md",
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/ui/components/atoms/**"],
    rules: {
      "func-style": ["error", "expression"],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "scripts/**",
      ".claude/hooks/**",
      ".claude/worktrees/**",
      "coverage/**",
      "docs/design/**",
    ],
  },
];

export default eslintConfig;
