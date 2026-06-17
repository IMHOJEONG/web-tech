import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import onlyWarn from "eslint-plugin-only-warn";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

export default [
  // ✅ 1️⃣ ignore는 반드시 맨 앞
  {
    ignores: [
      "**/package.json",
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "packages/tailwind-config/**",
      "packages/eslint-config/**",
      "packages/typescript-config/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },

  {
    plugins: {
      onlyWarn,
    },
  },
];
