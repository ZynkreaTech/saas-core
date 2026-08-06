#!/usr/bin/env node

// cd saas-core
// node scripts/create-module.mjs
// # Module path: auth/login
// # Display name: Login
// # Type: system

import * as p from "@clack/prompts";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

p.intro("Create ZynFlex Module (local scaffold — saas-core)");

// Accepts a nested path now, e.g. "auth/login" or just "billing".
const modulePath = await p.text({
  message: "Module path (e.g. 'billing' or 'auth/login' for nested)",
  validate: (v) => {
    if (!v) return "required";
    const segments = v.split("/").filter(Boolean);
    const bad = segments.find((s) => !/^[a-z0-9-]+$/.test(s));
    return bad
      ? `invalid segment "${bad}" — lowercase, numbers, hyphens only`
      : undefined;
  },
});

const segments = modulePath.split("/").filter(Boolean);
const lastSegment = segments[segments.length - 1];

const name = await p.text({
  message: "Display name (e.g. 'Login')",
});

const description = await p.text({
  message: "Short description",
});

const type = await p.select({
  message: "Module type?",
  options: [
    {
      value: "system",
      label: "System — ships to every tenant, cannot be uninstalled",
    },
    { value: "custom", label: "Custom — tenant subscribes to this" },
    {
      value: "shared",
      label: "Shared — internal utility, consumed by other modules",
    },
  ],
});

const uninstallable = type !== "system";
const folderMap = {
  system: "modules-system",
  custom: "modules-custom",
  shared: "modules-shared",
};

// Package name flattens the path with hyphens for npm-safety:
// auth/login -> @zynkreatech/module-system-auth-login
const pkgSuffix = { system: "system", custom: "custom", shared: "shared" }[
  type
];
const pkgName = `@zynkreatech/module-${pkgSuffix}-${segments.join("-")}`;

// Target folder KEEPS the real nesting on disk: modules/modules-system/auth/login
const targetDir = path.join(ROOT, "modules", folderMap[type], ...segments);

if (await fs.pathExists(targetDir)) {
  p.cancel(
    `modules/${folderMap[type]}/${modulePath} already exists — aborting.`,
  );
  process.exit(1);
}

// --- depth-aware relative path back to packages/config/tsconfig.base.json ---
// Non-nested (billing): modules/modules-system/billing         -> 3 levels -> "../../../"
// Nested   (auth/login): modules/modules-system/auth/login     -> 4 levels -> "../../../../"
// Formula: 2 fixed levels ("modules/" + type folder) + one per path segment.
const depth = 2 + segments.length;
const relativeToConfig =
  "../".repeat(depth) + "packages/config/tsconfig.base.json";

// --- folder tree, unchanged from before ---
const subfolders = [
  "controllers",
  "entities",
  "menus",
  "migrations",
  "permissions",
  "routes",
  "services",
  "ui",
];

for (const sub of subfolders) {
  await fs.ensureDir(path.join(targetDir, "src", sub));
  await fs.writeFile(
    path.join(targetDir, "src", sub, "index.ts"),
    `// ${sub} — placeholder, replace with real ${sub} for "${modulePath}".\nexport {};\n`,
  );
}

const componentName =
  segments
    .map((s) => s.replace(/[^a-zA-Z0-9]/g, ""))
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join("") + "Module";

await fs.writeFile(
  path.join(targetDir, "src", "ui", "index.tsx"),
  `// Real starting component — required, not a stub.\nexport default function ${componentName}() {\n  return <div>${name} module — placeholder UI</div>;\n}\n`,
);

await fs.writeFile(
  path.join(targetDir, "src", "index.ts"),
  `export { default } from "./ui";\nexport * from "./controllers";\nexport * from "./entities";\nexport * from "./menus";\nexport * from "./permissions";\nexport * from "./routes";\nexport * from "./services";\n`,
);

// --- manifest.json — key is the full path joined with "-" for guaranteed
// uniqueness even if two categories both have a "login" leaf ---
const manifest = {
  key: segments.join("-"), // e.g. "auth-login"
  name,
  description,
  version: "1.0.0",
  type,
  uninstallable,
  icon: "puzzle",
  entry: "./dist/index.js",
};
await fs.writeJson(path.join(targetDir, "manifest.json"), manifest, {
  spaces: 2,
});

// --- package.json ---
const peerDeps =
  type === "shared"
    ? {}
    : {
        "@zynkreatech/ui": "workspace:*",
        "@zynkreatech/core": "workspace:*",
        react: "latest",
      };

await fs.writeJson(
  path.join(targetDir, "package.json"),
  {
    name: pkgName,
    version: "1.0.0",
    main: "./dist/index.js",
    types: "./dist/index.d.ts",
    files: ["dist", "manifest.json"],
    scripts: {
      build: "tsup",
      dev: "nodemon",
      lint: "eslint . --max-warnings 0",
      typecheck: "tsc --noEmit",
    },
    peerDependencies: peerDeps,
    devDependencies: {
      tsup: "^8.0.0",
      typescript: "^5.5.0",
      "@types/react": "^19.2.0",
      eslint: "^9.9.0",
      "@eslint/js": "^9.9.0",
      "typescript-eslint": "^8.0.0",
      nodemon: "^3.1.0",
    },
  },
  { spaces: 2 },
);

// --- tsconfig.json — uses the depth-aware relative path computed above ---
await fs.writeJson(
  path.join(targetDir, "tsconfig.json"),
  {
    extends: relativeToConfig,
    compilerOptions: { jsx: "react-jsx", rootDir: "./src", outDir: "./dist" },
    include: ["src"],
  },
  { spaces: 2 },
);

await fs.writeFile(
  path.join(targetDir, "tsup.config.ts"),
  `import { defineConfig } from "tsup";\n\nexport default defineConfig({\n  entry: ["src/index.ts"],\n  format: ["esm"],\n  dts: true,\n  clean: true,\n  external: ["react", "react-dom"],\n});\n`,
);

await fs.writeJson(
  path.join(targetDir, "nodemon.json"),
  {
    watch: ["src"],
    ext: "ts,tsx",
    exec: "tsup",
    legacyWatch: true,
    delay: 300,
  },
  { spaces: 2 },
);

await fs.writeFile(
  path.join(targetDir, "eslint.config.mjs"),
  `import js from "@eslint/js";\nimport tseslint from "typescript-eslint";\n\nexport default tseslint.config(\n  { ignores: ["dist/**"] },\n  js.configs.recommended,\n  ...tseslint.configs.recommended\n);\n`,
);

p.outro(
  `✅ Created modules/${folderMap[type]}/${modulePath}\n\nNext:\n  pnpm install\n  pnpm --filter ${pkgName} build\n\nThen register it in ZynFlex's modules.registry.ts.`,
);
