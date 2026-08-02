// import { defineConfig } from "tsup";

// export default defineConfig({
//   entry: {
//     index: "src/index.ts",
//     "ui/pages/CustomerListPage": "src/ui/pages/CustomerListPage.tsx",
//   },
//   format: ["esm"],
//   dts: true,
//   clean: true,
//   splitting: false, // prevents tsup from factoring shared code (like
//   // CustomerService, used by both entries) into a
//   // separate chunk file. Directives only get hoisted
//   // onto entry-point outputs, never onto tsup's
//   // auto-generated shared chunks — so any chunk file
//   // is guaranteed to lose "use client" the moment
//   // client-only code gets split into one. Duplicating
//   // a few KB of shared code between two small entry
//   // files is a worthwhile tradeoff for correctness here.
//   external: ["react", "react-dom"],
// });

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["react", "react-dom"],
});