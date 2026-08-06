# ZynFlex Module System Restructure
**Version:** 1.0.2 (Semantic Versioning 2.0.0)
**Scope:** Restructures every module in `saas-core` (system, custom, shared) onto one uniform folder template + `manifest.json`, removes all modules except CRM, adds a new `modules-system/auth/login` module built to that template, and replaces `ZynFlex`'s split "system modules are static / custom modules are dynamic" loader with a single manifest-driven dynamic loader that treats every module identically.
**Relates to:** `ZynFlex-Platform-Setup-Guide-v2.1.0.md` Sections 5 (saas-core) and 6.6–6.7 (ZynFlex module registry). This document supersedes those sections; everything else in v2.1.0 (auth pluggability, provider split, nodemon dev workflow, link workflow) is unaffected and still applies as written.

---

## 0. Change Log

| Version | Date | Type | Description |
|---|---|---|---|
| 1.0.0 | 2026-08-04 | Created | Restructured module concept: every module now follows one folder template (`controllers/entities/menus/migrations/permissions/routes/services/ui/index.ts` + `manifest.json`). Deleted `module-system-billing`, `module-system-license`, `module-shared-data-grid-utils` — only `module-custom-crm` remains, migrated to the new template. Added new module `modules-system/auth/login` built fully to the new template. Added the `manifest.json` metadata spec, required on every module. Replaced `ZynFlex`'s `systemModules` (static import) / `customModuleLoaders` (dynamic import) split with a single `installedModules` registry that dynamically loads every module through its manifest, regardless of type. |
| 1.0.1 | 2026-08-04 | Fixed | `Cannot find name 'process'` TS error in `login.service.ts` (and any other module's `services/*.ts` that reads `process.env`, e.g. `crm`'s `contacts.service.ts`) — the module's own `package.json` was missing `@types/node`. Same root cause as the earlier `eslint: not found` issue: pnpm's isolated linker means each package needs its own copy of any `@types/*` package, the workspace root having it isn't enough. Added `"@types/node": "^20.0.0"` to `modules-system/auth/login/package.json`'s `devDependencies` (Section 6.2) and flagged that every module with a `services/` file touching `process.env` needs the same addition. |
| 1.0.2 | 2026-08-04 | Fixed | Same `Cannot find name 'process'` error **persisted after** `@types/node` was correctly installed (confirmed via `pnpm ls @types/node` showing it present) — the real root cause was the module's `tsconfig.json` (Section 6.4) setting an explicit `"types": ["react"]` array. Any explicit `types` array in `compilerOptions` **replaces** TypeScript's default "auto-include everything under `node_modules/@types`" behavior with an allow-list — `"node"` wasn't in it, so `@types/node` was installed but never loaded regardless of `package.json`. Fixed to `"types": ["react", "node"]`. This applies to every module template going forward (Section 3), not just login — `crm` and any future module copying this `tsconfig.json` as a starting point needs the same array. |

---

## 1. Why This Change (Plain English)

Up to now, "system modules" (Billing, License) were statically imported in `ZynFlex`, and "custom modules" (CRM) were dynamically imported through a separate lookup map. That meant two different code paths did the same job — resolving a module's component — and every new module required deciding up front which path it belonged to.

This restructure removes that split. **Every module — system, custom, or shared — is now loaded the same way**, through a `manifest.json` file that describes it and a dynamic `import()` that loads its UI on demand. Whether a module happens to ship with every tenant (system) or requires a subscription (custom) is now just a `type` field inside that same manifest — a data difference, not a code-path difference.

At the same time, every module's internal folder layout is standardized to mirror a real self-contained app slice — `controllers`, `entities`, `menus`, `migrations`, `permissions`, `routes`, `services`, `ui` — instead of a single `index.ts` file. This makes every module's shape predictable regardless of what it does, and gives each module a clear place to declare its own permissions, nav entries, and (documented, mirrored) database dependencies.

---

## 2. Modules Removed

The following are deleted from `saas-core/modules/`:

- `modules-system/billing/`
- `modules-system/license/`
- `modules-shared/data-grid-utils/`

```bash
cd saas-core
git rm -r modules/modules-system/billing
git rm -r modules/modules-system/license
git rm -r modules/modules-shared/data-grid-utils
```

Remove their entries from:
- `saas-core/pnpm-workspace.yaml` — no path changes needed (globs already cover any folder under `modules-system/*`/`modules-shared/*`), but run `pnpm install` afterward so the lockfile drops them.
- `ZynFlex/package.json` — remove `@zynkreatech/module-system-billing` and `@zynkreatech/module-system-license` from `dependencies`.
- `ZynFlex/next.config.ts` — remove both from `transpilePackages`.
- Any `.changeset/` files or CHANGELOG entries referencing them — leave historical CHANGELOG entries alone (they're a record of what happened), just stop publishing new versions of the removed packages.

**Only `modules-custom/crm/` survives**, and is migrated to the new template below (Section 4).

---

## 3. The Unified Module Folder Template

**New module generator**
`pnpm create-module`

**Module Structure**
Every module — system, custom, or shared — now has this shape:

```

<new-module-folder>/
├── src/
│   ├── controllers/
│   │   └── <action>.controller.ts     # orchestration: validate input, call service, return typed result
│   ├── entities/
│   │   └── <domain>.entity.ts         # zod schema + inferred TS type for this module's data shape
│   ├── menus/
│   │   └── <module>.menu.ts           # nav/sidebar contributions (can be an empty array)
│   ├── migrations/
│   │   └── <NNNN>_<description>.sql   # REFERENCE COPY of the real migration (see note below)
│   ├── permissions/
│   │   └── <module>.permissions.ts    # RBAC permission keys this module contributes
│   ├── routes/
│   │   └── <module>.routes.ts         # path -> lazy component map, read by the loader
│   ├── services/
│   │   └── <action>.service.ts        # calls the FastAPI Gateway; the only network boundary
│   ├── ui/
│   │   └── <Component>.tsx            # "use client" React components — has its OWN build entry (see 3.1)
│   └── index.ts                       # SERVER-SAFE exports only — routes, menus, permissions
├── eslint.config.mjs
├── LICENSE
├── manifest.json                       # static metadata — see Section 5
├── nodemon.json
├── package.json
├── readme.md
├── tsconfig.json
└── tsup.config.ts
```

**Why `controllers/entities/migrations` exist in a TypeScript frontend package:** `saas-core` publishes to npm and is consumed by `ZynFlex`/`ZynFlex-Desktop`, both frontend. The actual password hashing, database writes, and Alembic-style migrations run in `saas-backend` (FastAPI). So inside a `saas-core` module:
- `controllers/` = the frontend-side orchestration layer (validate → call service → return a typed result to the UI). Not an HTTP route handler.
- `entities/` = the zod schema/TS type contract this module's data must satisfy — the same shape `saas-backend`'s Pydantic model should mirror.
- `migrations/` = a **reference copy** of the SQL the real migration applies, checked in here so a developer never has to open a second repo to see what tables a module depends on. The actual migration that runs lives in `saas-backend`. Flagged in Open Decisions (Section 9) as something that should eventually be generated/synced rather than hand-mirrored.
- `services/` = the only place inside the module allowed to call `fetch()` against the API Gateway.
- `routes/` = **frontend routing** contribution (path → lazy component), consumed by `ZynFlex`'s loader (Section 7) — unrelated to FastAPI routes.
- `menus/`, `permissions/` = plain data contributions merged into the app shell / RBAC system at runtime.

### 3.1 RSC-safety rule (unchanged from the core `TenantProvider`/`QueryProvider` split)

`src/index.ts` must **never** re-export anything from `src/ui/`. UI components carry `"use client"`; everything else in the module (routes, menus, permissions, entities) is plain data safe for a Server Component to import. Mixing them into one bundle crashes the moment a Server Component imports anything from that file (see `ZynFlex-Platform-Setup-Guide-v2.1.0.md` Section 5.5/5.7 troubleshooting entry for the exact failure mode). Every module's `tsup.config.ts` therefore uses a **multi-entry** config: one entry for `index.ts`, one per UI component, wired through `package.json`'s `exports` map.

---
## Example of structure usage
## 4. `modules-custom/crm/` — Migrated to the New Template

```
saas-core/modules/modules-custom/crm/
├── src/
│   ├── controllers/
│   │   └── crm.controller.ts
│   ├── entities/
│   │   └── contact.entity.ts
│   ├── menus/
│   │   └── crm.menu.ts
│   ├── migrations/
│   │   └── 0001_create_contacts_table.sql
│   ├── permissions/
│   │   └── crm.permissions.ts
│   ├── routes/
│   │   └── crm.routes.ts
│   ├── services/
│   │   └── contacts.service.ts
│   ├── ui/
│   │   └── CrmModule.tsx
│   └── index.ts
├── manifest.json
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── nodemon.json
└── eslint.config.mjs
```

Move the existing placeholder component (`src/index.tsx` from v2.1.0) into `src/ui/CrmModule.tsx`, keep its `export default function CrmModule()` as-is for now, and add the surrounding files following the Login module's worked example in Section 6 as a template — the shapes are identical, only the domain (contacts vs. credentials) differs.

**`saas-core/modules/modules-custom/crm/manifest.json`**
```json
{
  "key": "module-custom-crm",
  "name": "CRM",
  "description": "Customer relationship management — contacts, deals, and activity tracking",
  "version": "1.0.0",
  "type": "custom",
  "uninstallable": true,
  "icon": "users",
  "entry": "./ui/CrmModule"
}
```

---

## 5. `manifest.json` — Required on Every Module

Every module — system, custom, or shared — must ship a `manifest.json` at its package root. This is the ONLY thing the `ZynFlex` loader (Section 7) reads to know a module exists, what to call it, and how to load it. It is published as part of the npm package (`package.json`'s `files` array must include it — see Section 6).

### 5.1 Schema

```ts
interface ModuleManifest {
  key: string;            // stable slug, matches the package name suffix. NEVER a UUID —
                           // real per-tenant install UUIDs are assigned separately at
                           // install time via the `module_installations` table. This key
                           // never changes after the module is created.
  name: string;            // display name shown in nav/app-switcher
  description?: string;
  version: string;          // mirrors package.json's version (SemVer 2.0.0)
  type: "system" | "custom" | "shared";
  uninstallable: boolean;    // system modules are typically false; custom modules true
  icon?: string;              // lucide-react icon name
  entry: string;                // subpath (relative to package root) to the default-exported
                                 // UI component, e.g. "./ui/LoginPage" — resolved by the loader
                                 // as `<packageName>/<entry>` via a static import() map (Section 7)
}
```

*Why `type` replaces the old "system module vs. custom module" code-path split: it's now just a value the loader and the sidebar read to decide default-installed vs. subscription-gated — never a reason to write a second loading mechanism.*

*Why no `id` field: consistent with the existing rule — `manifest.json` is static, build-time metadata. The database only knows this module exists at all once a tenant installs it, at which point `module_installations` assigns the real UUID. Two tenants installing the same module get two different UUIDs but read the exact same `key`.*

---

## 6. New Module — `modules-system/auth/login`

```
saas-core/modules/modules-system/auth/login/
├── src/
│   ├── controllers/
│   │   └── login.controller.ts
│   ├── entities/
│   │   └── login-credentials.entity.ts
│   ├── menus/
│   │   └── login.menu.ts
│   ├── migrations/
│   │   └── 0001_create_sessions_table.sql
│   ├── permissions/
│   │   └── login.permissions.ts
│   ├── routes/
│   │   └── login.routes.ts
│   ├── services/
│   │   └── login.service.ts
│   ├── ui/
│   │   └── LoginPage.tsx
│   └── index.ts
├── manifest.json
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── nodemon.json
└── eslint.config.mjs
```

*Note on `pnpm-workspace.yaml`: no change needed — `modules/modules-system/*` already matches any depth-1 folder under `modules-system/`, and `auth/login` is a nested path segment inside a single workspace package folder, not a second workspace package. The workspace package itself is `modules-system/auth/login`.*

### 6.1 `manifest.json`

```json
{
  "key": "module-system-auth-login",
  "name": "Login",
  "description": "Tenant user authentication screen and session handling",
  "version": "1.0.0",
  "type": "system",
  "uninstallable": false,
  "icon": "log-in",
  "entry": "./ui/LoginPage"
}
```

### 6.2 `package.json`

```json
{
  "name": "@zynkreatech/module-system-auth-login",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist", "manifest.json"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    },
    "./ui/LoginPage": {
      "types": "./dist/ui/LoginPage.d.ts",
      "import": "./dist/ui/LoginPage.mjs",
      "require": "./dist/ui/LoginPage.js"
    },
    "./manifest.json": "./manifest.json"
  },
  "scripts": {
    "build": "tsup",
    "dev": "nodemon",
    "lint": "eslint . --max-warnings 0",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "peerDependencies": {
    "@zynkreatech/ui": "workspace:*",
    "@zynkreatech/core": "workspace:*",
    "react": "latest"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.5.0",
    "@types/react": "^19.2.0",
    "@types/node": "^20.0.0",
    "eslint": "^9.9.0",
    "@eslint/js": "^9.9.0",
    "typescript-eslint": "^8.0.0",
    "nodemon": "^3.1.0"
  }
}
```
*`@types/node` is required because `services/login.service.ts` reads `process.env.NEXT_PUBLIC_API_GATEWAY_URL` — without it TypeScript has no ambient declaration for `process` and fails with `Cannot find name 'process'`. Any other module whose `services/*.ts` touches `process.env` (e.g. `crm`'s `contacts.service.ts`) needs this same line — pnpm's isolated linker means the workspace root having `@types/node` doesn't help a package that doesn't declare it itself.*

*`files` includes `manifest.json` explicitly — without it, npm/GitHub Packages would only publish `dist/`, and `ZynFlex`'s static `import ... from "@zynkreatech/module-system-auth-login/manifest.json"` (Section 7) would fail to resolve after install.*

### 6.3 `tsup.config.ts`

```ts
import { defineConfig } from "tsup";

// Two entries, same RSC-safety reasoning as @zynkreatech/core's provider
// split (Section 3.1 above): index.ts (server-safe: routes/menus/
// permissions) stays a separate compiled file from ui/LoginPage.tsx
// ("use client"), so a Server Component can import the metadata without
// ever evaluating client-only code.
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "ui/LoginPage": "src/ui/LoginPage.tsx",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["react", "react-dom"],
});
```

### 6.4 `tsconfig.json`

```json
{
  "extends": "../../../../packages/config/tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "rootDir": "./src",
    "outDir": "./dist",
    "types": ["react", "node"],
    "resolveJsonModule": true
  },
  "include": ["src", "manifest.json"]
}
```
*`types: ["react", "node"]` is required, not optional decoration — an explicit `types` array replaces TypeScript's default "load everything under `node_modules/@types`" behavior with an allow-list. Omitting `"node"` here causes `Cannot find name 'process'` in any `services/*.ts` file, even with `@types/node` correctly installed in `package.json` — the package exists on disk but is never loaded. `resolveJsonModule: true` + including `manifest.json` in `include` is what lets `index.ts`/the module registry `import` the manifest as typed JSON (Section 5, 7.1) rather than `require`-ing it untyped.*

### 6.5 `nodemon.json`

```json
{
  "watch": ["src"],
  "ext": "ts,tsx",
  "exec": "tsup",
  "legacyWatch": true,
  "delay": 300
}
```

### 6.6 `eslint.config.mjs`

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended
);
```

### 6.7 `src/entities/login-credentials.entity.ts`

```ts
import { z } from "zod";

// One schema drives both the runtime validation and the TypeScript type —
// same pattern as packages/core/src/schemas/tenant-registration.schema.ts.
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantSubdomain: z.string().regex(/^[a-z0-9-]+$/),
});
export type LoginCredentials = z.infer<typeof loginSchema>;
```

### 6.8 `src/services/login.service.ts`

```ts
import type { LoginCredentials } from "../entities/login-credentials.entity";

// The ONLY file in this module allowed to call fetch(). Talks to the API
// Gateway's single stable /auth/login shape — this module doesn't know or
// care whether AUTH_PROVIDER is "authentik" or "local" on the backend,
// since both emit identical TokenClaims shapes.
export async function loginService(credentials: LoginCredentials): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? "Invalid email or password");
  }
}
```

### 6.9 `src/controllers/login.controller.ts`

```ts
import { loginSchema, type LoginCredentials } from "../entities/login-credentials.entity";
import { loginService } from "../services/login.service";

// Orchestration layer: validate -> call service -> return a typed result
// the UI can render without ever touching fetch() or zod directly.
export interface LoginResult {
  success: boolean;
  error?: string;
}

export async function handleLogin(input: LoginCredentials): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await loginService(parsed.data);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Login failed" };
  }
}
```

### 6.10 `src/permissions/login.permissions.ts`

```ts
// Permission keys this module contributes to the RBAC system. CTM's
// license-service reads these to know what to grant/revoke per role.
export const loginPermissions = {
  LOGIN_ACCESS: "auth.login.access",
} as const;
```

### 6.11 `src/menus/login.menu.ts`

```ts
export interface ModuleMenuEntry {
  title: string;
  href: string;
}

// Login is a public-route module — it has no entry inside the authenticated
// app shell's sidebar, so this is intentionally empty. Still exported so
// every module's shape stays uniform for the loader (Section 7), which
// expects a `menu` array to exist even when it's empty.
export const loginMenu: ModuleMenuEntry[] = [];
```

### 6.12 `src/routes/login.routes.ts`

```ts
import type { ComponentType } from "react";

export interface ModuleRoute {
  path: string;
  component: () => Promise<{ default: ComponentType }>;
}

// Route contribution — path this module owns + a lazy loader for its
// component. `component` is a function (not a direct import) so route-level
// code splitting works, same rule as every other module.
export const loginRoutes: ModuleRoute[] = [
  {
    path: "/login",
    component: () => import("../ui/LoginPage"),
  },
];
```

### 6.13 `src/ui/LoginPage.tsx`

```tsx
"use client";
import { useState } from "react";
import { handleLogin } from "../controllers/login.controller";

// Default export is required — the loader (Section 7) renders this
// directly via <Component />, same contract as every other module.
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await handleLogin({ email, password, tenantSubdomain: "" });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Login failed");
    }
    // TODO: on success, hand off to NextAuth session creation and redirect
    // into /[locale]/[tenant].
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm mx-auto mt-24 space-y-4">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border rounded px-3 py-2"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded px-3 py-2"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary text-primary-foreground rounded px-3 py-2"
      >
        {submitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
```

### 6.14 `src/index.ts`

```ts
// Server-safe exports ONLY. LoginPage is NOT re-exported here — same
// RSC-safety rule as @zynkreatech/core (Section 3.1). The loader resolves
// the UI component via manifest.json's "entry" subpath instead.
export * from "./routes/login.routes";
export * from "./menus/login.menu";
export * from "./permissions/login.permissions";
```

### 6.15 `src/migrations/0001_create_sessions_table.sql`

```sql
-- REFERENCE COPY ONLY. The migration that actually runs against
-- PostgreSQL lives in saas-backend (FastAPI + alembic), scoped to the
-- tenant/license service that owns session storage. Mirrored here so this
-- module's on-disk footprint documents its own schema dependency without
-- requiring a second repo checkout to see it. Keep manually in sync until
-- the migration-sync tooling in Open Decisions (Section 9) exists.
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_user ON sessions (tenant_id, user_id);
```

---

## 7. `ZynFlex` — Unified Dynamic Module Loader

This replaces `src/config/site.ts`'s `systemModules` / `customModuleLoaders` split (v2.0.0/v2.1.0) entirely. There is now exactly one list, and every module — system, custom, shared — goes through it the same way.

### 7.1 `ZynFlex/src/config/modules.registry.ts` (new — replaces `site.ts`'s module section)

```ts
import type { ComponentType } from "react";
import loginManifest from "@zynkreatech/module-system-auth-login/manifest.json";
import crmManifest from "@zynkreatech/module-custom-crm/manifest.json";

export interface ModuleManifest {
  key: string;
  name: string;
  description?: string;
  version: string;
  type: "system" | "custom" | "shared";
  uninstallable: boolean;
  icon?: string;
  entry: string;
}

export interface InstalledModule {
  manifest: ModuleManifest;
  loadComponent: () => Promise<{ default: ComponentType }>;
}

// Every module the platform knows about is listed here ONCE, regardless of
// type. Adding a module = add one manifest import + one entry here + one
// dependency in package.json. This list is "what code exists to load" —
// whether a given tenant is currently ALLOWED to see a module is a
// separate, runtime check (useAvailableModules, Section 7.4), not
// something this file decides.
export const installedModules: InstalledModule[] = [
  {
    manifest: loginManifest as ModuleManifest,
    loadComponent: () => import("@zynkreatech/module-system-auth-login/ui/LoginPage"),
  },
  {
    manifest: crmManifest as ModuleManifest,
    loadComponent: () => import("@zynkreatech/module-custom-crm/ui/CrmModule"),
  },
];

export const staticNav = [
  { title: "Dashboard", href: "/" },
  { title: "Settings", href: "/settings" },
];
```
*Comment: `manifest.json` is imported statically (not dynamically) because JSON imports are cheap, synchronous, and needed immediately to build nav/routing — only the heavier UI **component** is loaded lazily via `loadComponent()`. This is the same reasoning `next.config.ts`'s `transpilePackages` already assumes: these packages ship un-transpiled source, so every module still needs an entry there too.*

### 7.2 `ZynFlex/src/lib/module-loader.ts` (new)

```ts
import dynamic from "next/dynamic";
import { installedModules } from "@/config/modules.registry";

// The single resolution function every route/nav element calls — replaces
// the old two-path systemModules-lookup / customModuleLoaders-lookup logic.
export function resolveModuleComponent(key: string) {
  const entry = installedModules.find((m) => m.manifest.key === key);
  if (!entry) return null;
  return dynamic(entry.loadComponent);
}

export function getModuleManifest(key: string) {
  return installedModules.find((m) => m.manifest.key === key)?.manifest ?? null;
}
```

### 7.3 `ZynFlex/app/[locale]/[tenant]/[moduleId]/page.tsx` (rewritten — one path for every module)

```tsx
import { notFound } from "next/navigation";
import { resolveModuleComponent } from "@/lib/module-loader";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;

  // No more "check systemModules first, then fall back to
  // customModuleLoaders" — one lookup, one code path, for every module.
  const Component = resolveModuleComponent(moduleId);
  if (!Component) notFound();

  return <Component />;
}
```

### 7.4 Sidebar — reads the same unified list

`ZynFlex/src/components/app-shell/sidebar.tsx` (update — replaces the `systemModules.map(...)` block from v2.1.0 Section 6.10):

```tsx
"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { installedModules, staticNav } from "@/config/modules.registry";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 border-r bg-surface-muted p-2 space-y-1">
      {staticNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pathname === item.href ? "font-semibold" : ""}
        >
          {item.title}
        </Link>
      ))}

      <hr className="my-2" />

      {/* TODO (open item, unchanged from prior guides): this currently
          lists every module in the registry regardless of type or tenant
          subscription. Replace with useAvailableModules(tenantId), which
          should filter this same `installedModules` list against the
          tenant's live subscription/license state — system modules
          (manifest.type === "system") always pass that filter, custom
          modules only pass it if subscribed. */}
      {installedModules.map((m) => (
        <Link
          key={m.manifest.key}
          href={`/${m.manifest.key}`}
          className={pathname?.includes(m.manifest.key) ? "font-semibold" : ""}
        >
          {m.manifest.name}
        </Link>
      ))}
    </nav>
  );
}
```

### 7.5 `ZynFlex/next.config.ts` — `transpilePackages` update

```ts
transpilePackages: [
  "@zynkreatech/ui",
  "@zynkreatech/core",
  "@zynkreatech/module-system-auth-login",
  "@zynkreatech/module-custom-crm",
],
```
*(Removed `module-system-billing` and `module-system-license`, added `module-system-auth-login`.)*

### 7.6 `ZynFlex/package.json` — dependency update

```json
"@zynkreatech/module-system-auth-login": "^1.0.0",
"@zynkreatech/module-custom-crm": "^1.0.0"
```
*(Removed the billing/license lines.)*

---

## 8. Migration Checklist

1. `saas-core`: delete billing/license/data-grid-utils folders + workspace/lockfile cleanup (Section 2).
2. `saas-core`: migrate `modules-custom/crm` into the new template (Section 4), add its `manifest.json`.
3. `saas-core`: scaffold `modules-system/auth/login` exactly as shown (Section 6).
4. `saas-core`: `pnpm install`, `pnpm build`, `pnpm lint`, `pnpm typecheck` — confirm both remaining modules build clean, including the new `manifest.json`/subpath `exports`.
5. `saas-core`: `pnpm changeset` — mark billing/license/data-grid-utils as removed (Changesets supports this via a major bump + removal note in each's last CHANGELOG entry, or drop them from `.changeset/config.json`'s tracked set if fully deleting), publish CRM (minor — restructured, same public behavior) and the new login module (initial 1.0.0).
6. `ZynFlex`: replace `src/config/site.ts`'s module section with `src/config/modules.registry.ts` (Section 7.1), add `src/lib/module-loader.ts` (7.2), update the `[moduleId]/page.tsx` (7.3), `sidebar.tsx` (7.4), `next.config.ts` (7.5), and `package.json` (7.6).
7. `ZynFlex`: `pnpm install`, `pnpm dev`, confirm `/login` and `/crm`-style module routes both resolve through the same `resolveModuleComponent()` call.

---

## 9. Open Decisions

- **Migration-sync tooling**: `migrations/*.sql` files inside `saas-core` modules are currently hand-mirrored reference copies of the real migrations in `saas-backend`. A generation/sync step (or a shared migrations package) should replace manual duplication before this scales past two or three modules.
- **`useAvailableModules(tenantId)`**: still not built (carried over from prior guides) — the sidebar currently renders every entry in `installedModules` unconditionally; it needs to cross-reference live tenant subscription/license state, filtering custom modules while always passing system modules through.
- **Nested module sub-routes** (e.g. a future `crm/[contactId]`): the current `[moduleId]` catch-all only handles one path segment — not yet addressed by this restructure.
- **Whether `controllers/`/`services/` should eventually generate their FastAPI-side counterparts automatically** (e.g. from the `entities/` zod schema) rather than being written twice by hand in `saas-core` and `saas-backend`.
