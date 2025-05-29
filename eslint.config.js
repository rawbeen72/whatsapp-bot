// eslint.config.js
const globals = require("globals");
const pluginJs = require("@eslint/js");
const pluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = [
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
  pluginJs.configs.recommended,
  pluginPrettierRecommended,
  {
    rules: {
      "prettier/prettier": "warn",
    },
  },
  {
    ignores: ["node_modules/", "package-lock.json", ".prettierrc.json", "eslint.config.js"],
  },
];
