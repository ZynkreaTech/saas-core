import type { ModuleContext } from "@zynkreatech/sdk";

// Shape matches ctx.migrations.run()'s expected per-migration unit. The
// actual SQL execution is delegated to the FastAPI licensing/migration
// service (Section 5.6 open item) — this file just declares intent + order.
export const up = async (ctx: ModuleContext) => {
  ctx.logger.info("Running migration: 001_create_customers");
  // await ctx.api.post("/migrations/apply", { module: "crm", file: "001_create_customers" });
};

export const down = async (ctx: ModuleContext) => {
  ctx.logger.info("Rolling back migration: 001_create_customers");
};
