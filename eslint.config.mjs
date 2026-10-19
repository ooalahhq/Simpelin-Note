import js from "@eslint/js";
import ts from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
export default defineConfig([
  globalIgnores([
    ".next/**",
    ".browser-fixture/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "public/sw.js",
  ]),
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [js.configs.recommended, ...ts.configs.recommended],
    plugins: { "react-hooks": hooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      globals: { process: "readonly", URL: "readonly", console: "readonly" },
    },
    rules: { ...js.configs.recommended.rules },
  },
]);
