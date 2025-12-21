import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import baseConfig from "./base.js";

export default [
  // ✅ 2️⃣ 공통 base config (default export 전제)
  ...baseConfig,

  // ✅ 3️⃣ JS / TS 기본
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ✅ 4️⃣ React
  {
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
  },

  // ✅ 5️⃣ React Hooks
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

  // ✅ 6️⃣ Prettier는 반드시 맨 뒤
  prettier,
];
