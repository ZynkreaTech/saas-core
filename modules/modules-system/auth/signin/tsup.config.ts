import { defineConfig } from "tsup";

import { globSync } from "glob";
import path from "node:path";

// Auto-discovers every .tsx file under src/ui/ so a new UI file just needs
// to exist on disk — no manual entry to remember to add here.
const uiEntries = Object.fromEntries(
  globSync("src/ui/**/*.tsx").map((file) => [
    path.relative("src", file).replace(/\.tsx$/, ""),
    file,
  ]),
);

// Two entries, same RSC-safety reasoning as @zynkreatech/core's provider
// split (Section 3.1 above): index.ts (server-safe: routes/menus/
// permissions) stays a separate compiled file from ui/LoginPage.tsx
// ("use client"), so a Server Component can import the metadata without
// ever evaluating client-only code.
export default defineConfig({
  entry: {
    index: "src/index.ts",
    ...uiEntries,
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom"],
});
