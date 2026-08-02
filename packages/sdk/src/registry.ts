import type {
  ModuleContext,
  ModuleDefinition,
  ModuleMenuItem,
  ModulePermission,
  ModuleRoute,
} from "./types";

export interface ModuleRegistrySnapshot {
  routes: Map<string, ModuleRoute[]>;
  menus: ModuleMenuItem[];
  permissions: ModulePermission[];
}

/**
 * Host-side (ZynFlex) orchestrator. Walks a module's lifecycle in a fixed
 * order and collects whatever it registers via ctx.registerRoutes/Menus/
 * Permissions into one place the [moduleId] catch-all and Sidebar/
 * AppSwitcher read from — this is the piece that turns N independent
 * modules into one coherent nav + routing table.
 */
export class ModuleRegistry {
  private routes = new Map<string, ModuleRoute[]>();
  private menus: ModuleMenuItem[] = [];
  private permissions: ModulePermission[] = [];
  private booted = new Set<string>();

  async installAndBoot(module: ModuleDefinition, ctx: ModuleContext) {
    if (module.__kind !== "zynkrea-module") {
      throw new Error(
        "ModuleRegistry received an object not created by defineModule().",
      );
    }

    if (module.install) await module.install(ctx);

    if (module.boot) {
      await module.boot(ctx);
    } else {
      // Modules that skip boot() still get their manifest-level fields
      // registered directly, so a minimal module (just routes, no logic)
      // doesn't have to write a boot() that only forwards its own fields.
      if (module.routes) ctx.registerRoutes(module.routes);
      if (module.menus) ctx.registerMenus(module.menus);
      if (module.permissions) ctx.registerPermissions(module.permissions);
    }

    this.booted.add(module.manifest.id);
  }

  async shutdown(module: ModuleDefinition, ctx: ModuleContext) {
    if (module.shutdown) await module.shutdown(ctx);
    this.booted.delete(module.manifest.id);
  }

  async uninstall(module: ModuleDefinition, ctx: ModuleContext) {
    if (!module.manifest.uninstallable) {
      throw new Error(
        `Module "${module.manifest.id}" is not uninstallable (system: true).`,
      );
    }
    if (module.uninstall) await module.uninstall(ctx);
    this.routes.delete(module.manifest.id);
  }

  // Called from inside a ModuleContext implementation (see create-context.ts) —
  // not meant to be called directly by module authors.
  registerRoutes(moduleId: string, routes: ModuleRoute[]) {
    this.routes.set(moduleId, [
      ...(this.routes.get(moduleId) ?? []),
      ...routes,
    ]);
  }
  registerMenus(menus: ModuleMenuItem[]) {
    this.menus.push(...menus);
  }
  registerPermissions(permissions: ModulePermission[]) {
    this.permissions.push(...permissions);
  }

  isBooted(moduleId: string) {
    return this.booted.has(moduleId);
  }

  snapshot(): ModuleRegistrySnapshot {
    return {
      routes: this.routes,
      menus: [...this.menus],
      permissions: [...this.permissions],
    };
  }
}
