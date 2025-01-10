/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@web-tech/eslint-config/next.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
};
