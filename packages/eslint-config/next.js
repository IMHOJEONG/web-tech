import js from "@eslint/js";
import pluginNext from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier/flat";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import baseConfig from "./base.js";

export default [
  // ✅ 2️⃣ base config (default export 전제)
  ...baseConfig,

  // ✅ 3️⃣ JS / TS
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ✅ 4️⃣ Next.js 기본 ignore
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  // ✅ 5️⃣ React
  {
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
      },
    },
  },

  // ✅ 6️⃣ Next.js rules
  {
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },

  // ✅ 7️⃣ React Hooks
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
  },

  // ✅ 8️⃣ Prettier는 항상 맨 뒤
  prettier,
];
