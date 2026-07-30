import js from "@eslint/js";
import tseslint from "typescript-eslint";

// Same rationale as packages/ui/eslint.config.js — a plain library ruleset,
// not a Next.js one.
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
