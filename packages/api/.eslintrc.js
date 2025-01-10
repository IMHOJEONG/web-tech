/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@web-tech/eslint-config/library.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
};
