import { defineConfig } from "tsup";

// tsup compiles the shared UI library into both ESM and CJS output so it
// works whether the consuming app uses import/export or require().
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true, // also generate .d.ts type files
  clean: true, // wipe dist/ before each build
  external: ["react", "react-dom"], // don't bundle React itself — see peerDependencies above
});
