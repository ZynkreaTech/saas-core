import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**"] }, // never lint compiled build output
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
