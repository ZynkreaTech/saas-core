import type { ModuleContext } from "@zynkreatech/sdk";
import { LeadService } from "../services/LeadService";

export class LeadController {
  private service: LeadService;
  constructor(ctx: ModuleContext) {
    this.service = new LeadService(ctx);
  }

  async index(customerId?: string) {
    return this.service.list(customerId);
  }

  async updateStatus(
    leadId: string,
    status: "new" | "contacted" | "qualified" | "won" | "lost",
  ) {
    return this.service.updateStatus(leadId, status);
  }
}
