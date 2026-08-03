import type { ModuleContext } from "@zynkreatech/sdk";

export const up = async (ctx: ModuleContext) => {
  ctx.logger.info("Running migration: 002_create_leads");
};

export const down = async (ctx: ModuleContext) => {
  ctx.logger.info("Rolling back migration: 002_create_leads");
};
