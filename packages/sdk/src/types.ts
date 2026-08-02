import type { ComponentType } from "react";

export type ModuleId = string;

export interface ModuleManifest {
  id: ModuleId;
  name: string;
  version: string; // this module's own SemVer, independent of package.json's registry version
  system: boolean; // true = ships with every tenant, cannot be uninstalled
  uninstallable: boolean; // redundant with `system` today, kept separate in case a future
  // module needs to be non-system but still pinned (e.g. compliance-mandated)
  icon?: string;
  description?: string;
}

export interface ModuleRoute {
  // Relative to the module's own URL segment. "" = the module's index page
  // (e.g. /billing), "[invoiceId]" = a nested dynamic segment
  // (e.g. /billing/123) — this is the mechanism that resolves the
  // "nested sub-routes under [moduleId]" open item from the Build Guide.
  path: string;
  // A lazy loader instead of a direct component reference. This is what
  // keeps client-only code (hooks, "use client") out of the server-safe
  // module definition entirely — index.ts never has a static import path
  // to the actual component source, only a function that resolves it when
  // called, exactly like customModuleLoaders already works one level up
  // in ZynFlex's site.ts.
  component: () => Promise<{ default: ComponentType<any> }>;
  exact?: boolean;
}

export interface ModuleMenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  order?: number;
  parentId?: string; // for a future nested/grouped AppSwitcher
}

export interface ModulePermission {
  id: string; // dot-namespaced, e.g. "billing.invoice.read"
  label: string;
  description?: string;
}

export interface ModuleLogger {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
}

export interface ModuleMigrationRunner {
  run: () => Promise<void>;
  rollback: () => Promise<void>;
}

export interface ModuleApiClient {
  get: <T = unknown>(path: string) => Promise<T>;
  post: <T = unknown>(path: string, body?: unknown) => Promise<T>;
}

// Everything a module's lifecycle hooks are handed. The HOST (ZynFlex)
// builds a real implementation of this per-module via createModuleContext()
// — a module's own package never implements ModuleContext itself, it only
// consumes what it's given.
export interface ModuleContext {
  tenantId: string;
  locale: string;
  logger: ModuleLogger;
  migrations: ModuleMigrationRunner;
  registerRoutes: (routes: ModuleRoute[]) => void;
  registerMenus: (menus: ModuleMenuItem[]) => void;
  registerPermissions: (permissions: ModulePermission[]) => void;
  api: ModuleApiClient;
}

export interface ModuleLifecycleHooks {
  /** Runs once, the first time a tenant subscribes to this module. Migrations, seed data. */
  install?: (ctx: ModuleContext) => Promise<void> | void;
  /** Runs every time the module is activated for a request/session — register routes/menus/permissions here. */
  boot?: (ctx: ModuleContext) => Promise<void> | void;
  /** Runs when the module is deactivated for a session (not uninstalled) — release listeners, timers, etc. */
  shutdown?: (ctx: ModuleContext) => Promise<void> | void;
  /** Runs once, when a tenant unsubscribes. Never called if manifest.uninstallable === false. */
  uninstall?: (ctx: ModuleContext) => Promise<void> | void;
}

export interface ModuleDefinitionInput extends ModuleLifecycleHooks {
  manifest: ModuleManifest;
  routes?: ModuleRoute[];
  menus?: ModuleMenuItem[];
  permissions?: ModulePermission[];
  /**
   * Default entry component — what the [moduleId] catch-all renders when no
   * boot() hook has registered a more specific route match. Keeps simple
   * modules (no sub-routes) usable without writing a boot() at all.
   */
  component?: ComponentType<any>;
}

export interface ModuleDefinition extends ModuleDefinitionInput {
  readonly __kind: "zynkrea-module"; // type brand — lets ModuleRegistry reject a plain object that forgot defineModule()
}
