import type {
  ModuleContext,
  ModuleMenuItem,
  ModulePermission,
  ModuleRoute,
} from "./types";
import type { ModuleRegistry } from "./registry";

export interface CreateModuleContextOptions {
  moduleId: string;
  tenantId: string;
  locale: string;
  registry: ModuleRegistry;
  apiBaseUrl: string;
}

/**
 * The concrete ModuleContext ZynFlex actually hands to install()/boot().
 * Kept separate from types.ts on purpose: a module's own package only ever
 * imports the ModuleContext *interface*, never this implementation — so a
 * module can be unit-tested against a fake context without pulling in fetch/
 * the real registry at all.
 */
export function createModuleContext(
  opts: CreateModuleContextOptions,
): ModuleContext {
  const { moduleId, tenantId, locale, registry, apiBaseUrl } = opts;

  return {
    tenantId,
    locale,
    logger: {
      info: (msg, meta) => console.info(`[${moduleId}]`, msg, meta ?? ""),
      warn: (msg, meta) => console.warn(`[${moduleId}]`, msg, meta ?? ""),
      error: (msg, meta) => console.error(`[${moduleId}]`, msg, meta ?? ""),
    },
    migrations: {
      // Explicit "not implemented" rather than a silent no-op — a module
      // author calling ctx.migrations.run() should fail loudly until this
      // is wired to the real FastAPI licensing/migration endpoint, not
      // quietly do nothing and look like it worked.
      run: async () => {
        throw new Error(
          `migrations.run() not implemented for module "${moduleId}"`,
        );
      },
      rollback: async () => {
        throw new Error(
          `migrations.rollback() not implemented for module "${moduleId}"`,
        );
      },
    },
    registerRoutes: (routes: ModuleRoute[]) =>
      registry.registerRoutes(moduleId, routes),
    registerMenus: (menus: ModuleMenuItem[]) => registry.registerMenus(menus),
    registerPermissions: (permissions: ModulePermission[]) =>
      registry.registerPermissions(permissions),
    api: {
      get: async (path) => {
        const res = await fetch(`${apiBaseUrl}${path}`, {
          headers: { "X-Tenant-ID": tenantId, "Accept-Language": locale },
        });
        if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
        return res.json();
      },
      post: async (path, body) => {
        const res = await fetch(`${apiBaseUrl}${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-ID": tenantId,
            "Accept-Language": locale,
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
        return res.json();
      },
    },
  };
}
