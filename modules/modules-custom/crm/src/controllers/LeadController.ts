import type { ModuleContext } from "@zynkreatech/sdk";
import { LeadService } from "../services/LeadService";

export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";

export class LeadController {
  private service: LeadService;
  constructor(ctx: ModuleContext) {
    this.service = new LeadService(ctx);
  }

  async index(customerId?: string) {
    return this.service.list(customerId);
  }

  async updateStatus(leadId: string, status: LeadStatus) {
    return this.service.updateStatus(leadId, status);
  }
}
