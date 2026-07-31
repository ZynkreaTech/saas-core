# @zynkreatech / saas-core

Shared building blocks for the ZynFlex Platform: UI components, hooks/stores/providers, i18n, and **every module** (system + custom) — all published as versioned npm packages that `ZynFlex` and `saas-desktop` install as dependencies.

> **This repo must be published successfully before `ZynFlex` or `saas-desktop` can install anything.** They resolve `@zynkreatech/*` packages from GitHub Packages, not from a local path.

---

## What lives here

| Concept | Meaning |
|---|---|
| **Core** | Shared UI, hooks, providers, and the module-loading system itself — reused by both the web app and the desktop app |
| **System modules** | Ship to every tenant automatically, can never be uninstalled (e.g. Billing, License) |
| **Custom modules** | Optional — a tenant subscribes to them, and the frontend only loads them if the subscription exists (e.g. CRM) |

This monorepo uses **pnpm workspaces + Turborepo** for builds and **Changesets** for independent per-package semantic versioning, all published from one CI pipeline.

---

## Repo structure

```
saas-core/
├── .github/workflows/publish.yml   # the only publish path
├── .changeset/config.json
├── scripts/
│   ├── generate-barrels.sh         # barrel-export generator (Linux/macOS)
│   └── generate-barrels.ps1        # barrel-export generator (Windows)
├── packages/
│   ├── ui/            # @zynkreatech/ui     — ShadCN-based component library
│   ├── core/           # @zynkreatech/core   — providers, hooks, stores, schemas
│   ├── config/         # @zynkreatech/config — shared eslint/tsconfig presets
│   └── i18n/           # @zynkreatech/i18n   — shared next-intl setup
├── modules/
│   ├── modules-system/  # billing, license — always installed
│   ├── modules-custom/  # crm, etc. — tenant-subscribable
│   └── modules-shared/  # internal utilities shared *between* modules
├── .env.example
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## Prerequisites

- Node.js ≥ 20
- pnpm (`packageManager: pnpm@9.0.0`)
- A **classic** GitHub Personal Access Token with `write:packages` + `read:packages` scopes (`repo` too if any of the three repos are private)

### Package scope

All packages here publish under **`@zynkreatech`**, matching the GitHub org login (`ZynkreaTech`, lowercased). GitHub Packages requires this exact match — if the org is ever renamed, the scope must be renamed everywhere (every `package.json`, `.npmrc`, and import statement).

---

## Local setup

```bash
git clone https://github.com/ZynkreaTech/saas-core.git
cd saas-core
cp .env.example .env
# fill in GH_PACKAGES_TOKEN in .env for local installs

export GH_PACKAGES_TOKEN=<your-token>
pnpm install
pnpm build
pnpm lint
pnpm typecheck
```

---

## Releasing a change

Changesets tracks each package/module independently but publishes all of them from one pipeline run.

```bash
# 1. Make your change inside packages/* or modules/*

# 2. Record the intended version bump
pnpm changeset
# select the affected package(s), choose patch/minor/major

# 3. Commit and push — CI takes it from here
git add .changeset
git commit -m "feat: <description>"
git push origin main
```

Pushing to `main` triggers `.github/workflows/publish.yml`, which installs, builds, lints, typechecks, and runs `changeset publish` — publishing every changed package to GitHub Packages.

Verify a publish succeeded:

```bash
pnpm view @zynkreatech/ui --registry https://npm.pkg.github.com
```

---

## Using this locally inside `ZynFlex` / `saas-desktop` (without publishing every time)

```bash
# inside saas-core
pnpm build
cd packages/ui && pnpm link --global && cd ../..
cd packages/core && pnpm link --global && cd ../..

# inside ZynFlex (or saas-desktop)
pnpm link --global @zynkreatech/ui
pnpm link --global @zynkreatech/core

# keep saas-core rebuilding on change:
pnpm -r -- build --watch
```

Revert before committing/pushing from the consumer repo:

```bash
pnpm unlink --global @zynkreatech/ui
pnpm unlink --global @zynkreatech/core
pnpm install --force
```

**Never commit a `file:../saas-core/...` dependency path.** It breaks in CI (no sibling repo checkout exists there) and on Windows-style paths.

---

## Adding a new module

1. Create the package under `modules/modules-system/<name>/` (always-on) or `modules/modules-custom/<name>/` (tenant-subscribable).
2. Give it a `package.json` following the pattern in the existing modules — `@zynkreatech/ui` and `@zynkreatech/core` as `peerDependencies` (`workspace:*` while inside this repo).
3. Run `pnpm changeset`, select the new package, push.
4. Register it in `ZynFlex`'s module registry (`src/config/site.ts`) and add it as a dependency there.

Whether a module is "system" or "custom" is a **runtime** flag read by the consuming app's module registry — it is not encoded in this repo's `package.json` files.

---

## Adding/updating ShadCN UI components

ShadCN's CLI only runs inside a real Next.js app, so components are generated in `ZynFlex` first, verified, then promoted here:

1. `shadcn add <component>` inside `ZynFlex`.
2. Copy the generated file(s) into `packages/ui/src/components/ui/`.
3. Regenerate the barrel export:
   ```bash
   ./scripts/generate-barrels.sh packages/ui/src/components/ui
   ```
4. Remove the local copy from `ZynFlex` once promoted, so there's a single long-term home for shared components.

---

## Scripts reference

| Command | Purpose |
|---|---|
| `pnpm build` | Build every package (Turborepo, dependency-ordered) |
| `pnpm dev` | Watch-build every package |
| `pnpm lint` | Lint every package |
| `pnpm typecheck` | Typecheck every package |
| `pnpm changeset` | Record a version bump for changed packages |
| `pnpm release` | Build + `changeset publish` (normally run by CI, not locally) |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `E401 Unauthorized` during `changeset publish` | `GH_PACKAGES_TOKEN` missing from that workflow step's own `env:` block, or the PAT is fine-grained/expired/not SSO-authorized |
| `pnpm install` can't find `@zynkreatech/*` peer packages | Expected locally before first publish — install still succeeds, peers resolve once `ZynFlex`/`saas-desktop` install from the registry |
| `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` | Run a plain `pnpm install` (no `--frozen-lockfile`) and commit the regenerated lockfile |
| `! [rejected] main -> main (fetch first)` on first push | Repo was auto-initialized with a README on GitHub — recreate it unchecked, or `git pull --allow-unrelated-histories` |
| Barrel script produces an empty `index.ts` | Point it directly at the folder *containing* the components, not the parent folder |

---

## Related repos

- [`ZynFlex`](https://github.com/ZynkreaTech/ZynFlex) — the Next.js frontend, consumes these packages
- `saas-desktop` — Tauri desktop app, consumes `@zynkreatech/ui` / `@zynkreatech/core` (not yet scaffolded)

## Versioning

Every package follows [Semantic Versioning 2.0.0](https://semver.org/), tracked independently via Changesets but published together from one CI pipeline.
