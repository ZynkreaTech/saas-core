import { defineConfig } from "tsup";

// tsup compiles the shared UI library into both ESM and CJS output so it
// works whether the consuming app uses import/export or require().
export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom"],
});
