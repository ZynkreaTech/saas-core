import { defineModule } from "@zynkreatech/sdk";
import manifest from "../manifest.json";
import { webRoutes } from "./routes/web";
import { apiRoutes } from "./routes/api";
import { sidebarMenus } from "./menus/sidebar";
import { permissions } from "./permissions/permissions";

export default defineModule({
  // manifest.json stays the single source of truth for identity/version/
  // dependencies — index.ts doesn't restate any of that, just imports it.
  // Note: manifest.json has NO "id" field — see Section 4 for why.
  manifest: {
    id: manifest.technical_name, // stable slug used as the map key everywhere in-process
    name: manifest.display_name,
    version: manifest.version,
    system: false, // CRM is tenant-subscribable, not bundled by default
    uninstallable: true,
    icon: manifest.icon,
    description: manifest.description,
  },
  routes: webRoutes,
  menus: sidebarMenus,
  permissions,

  async install(ctx) {
    ctx.logger.info(`Installing ${manifest.display_name} v${manifest.version}`);
    await ctx.migrations.run();
  },
  async boot(ctx) {
    ctx.registerRoutes(webRoutes);
    ctx.registerMenus(sidebarMenus);
    ctx.registerPermissions(permissions);
    // apiRoutes(ctx) would be handed to the backend gateway layer here,
    // not to the frontend ModuleRegistry — kept separate on purpose since
    // web vs api routes have different consumers.
  },
  async uninstall(ctx) {
    ctx.logger.warn(
      `Uninstalling ${manifest.display_name} — this does not delete tenant data`,
    );
  },
});
