import js from "@eslint/js";
import tseslint from "typescript-eslint";

// This is a plain TypeScript library, not a Next.js app, so it deliberately
// does NOT extend "next/core-web-vitals" (that ruleset assumes a Next.js
// project). Keep the ruleset here generic and framework-agnostic instead.
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-console": "warn",
    },
  },
);
