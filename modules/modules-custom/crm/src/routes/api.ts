import type { ModuleContext } from "@zynkreatech/sdk";
import { CustomerController } from "../controllers/CustomerController";
import { LeadController, LeadStatus } from "../controllers/LeadController";

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

// Minimal per-route request shapes — just enough structure to satisfy the
// no-explicit-any rule without over-modeling the actual HTTP framework,
// since binding to a real request type is the host's job (see comment
// at the top of this file).
interface CustomerStoreRequest {
  body: { name: string; email: string; [key: string]: unknown };
}
interface LeadIndexRequest {
  query?: { customerId?: string };
}
interface LeadStatusUpdateRequest {
  params: { id: string };
  body: { status: LeadStatus };
}

export function apiRoutes(ctx: ModuleContext): ApiRouteDef[] {
  const customers = new CustomerController(ctx);
  const leads = new LeadController(ctx);

  return [
    { method: "GET", path: "/customers", handler: () => customers.index() },
    {
      method: "POST",
      path: "/customers",
      handler: (_ctx, req) =>
        customers.store((req as CustomerStoreRequest).body),
    },
    {
      method: "GET",
      path: "/leads",
      handler: (_ctx, req) =>
        leads.index((req as LeadIndexRequest).query?.customerId),
    },
    {
      method: "PUT",
      path: "/leads/:id/status",
      handler: (_ctx, req) => {
        const { params, body } = req as LeadStatusUpdateRequest;
        return leads.updateStatus(params.id, body.status);
      },
    },
  ];
}
