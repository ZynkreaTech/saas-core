import { defineConfig } from "tsup";


// import { globSync } from "glob";
// import path from "node:path";

// Auto-discovers every .tsx file under src/ui/ so a new UI file just needs
// to exist on disk — no manual entry to remember to add here.
// const uiEntries = Object.fromEntries(
//   globSync("src/ui/**/*.tsx").map((file) => [
//     path.relative("src", file).replace(/\.tsx$/, ""),
//     file,
//   ]),
// );

// tsup compiles the shared UI library into both ESM and CJS output so it
// works whether the consuming app uses import/export or require().
export default defineConfig({
  entry: {
    index: "src/index.ts",
    // "ui/PageContainer": "src/components/custom_reusable/page_container/PageContainer.tsx",
    // "ui/Auth-PublicContainer": "src/components/custom_reusable/container/Auth-PublicContainer.tsx",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom"],
});
