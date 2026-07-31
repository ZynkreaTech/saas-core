import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "providers/tenant-provider": "src/providers/tenant-provider.tsx",
    "providers/query-provider": "src/providers/query-provider.tsx",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom"],
});
