import type { ModuleContext } from "@zynkreatech/sdk";
import { CustomerController } from "../controllers/CustomerController";
import { LeadController } from "../controllers/LeadController";

// Declarative API surface — NOT wired to a real HTTP framework here.
// This is the manifest the backend gateway (FastAPI) or a Next.js route
// handler layer reads to know "which methods/paths does crm expose,
// and which controller method handles each" — the actual binding is the
// host's job, this module just declares the shape.
export interface ApiRouteDef {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string; // relative to /api/modules/crm
  handler: (ctx: ModuleContext, req: unknown) => Promise<unknown>;
}

export function apiRoutes(ctx: ModuleContext): ApiRouteDef[] {
  const customers = new CustomerController(ctx);
  const leads = new LeadController(ctx);

  return [
    { method: "GET", path: "/customers", handler: () => customers.index() },
    {
      method: "POST",
      path: "/customers",
      handler: (_ctx, req: any) => customers.store(req.body),
    },
    {
      method: "GET",
      path: "/leads",
      handler: (_ctx, req: any) => leads.index(req.query?.customerId),
    },
    {
      method: "PUT",
      path: "/leads/:id/status",
      handler: (_ctx, req: any) =>
        leads.updateStatus(req.params.id, req.body.status),
    },
  ];
}
