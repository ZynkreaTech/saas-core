import type { ModuleContext } from "@zynkreatech/sdk";
import type { Lead } from "../entities/Lead";

export class LeadService {
  constructor(private ctx: ModuleContext) {}

  async list(customerId?: string): Promise<Lead[]> {
    const query = customerId ? `?customerId=${customerId}` : "";
    return this.ctx.api.get<Lead[]>(`/crm/leads${query}`);
  }

  async updateStatus(leadId: string, status: Lead["status"]): Promise<Lead> {
    return this.ctx.api.post<Lead>(`/crm/leads/${leadId}/status`, { status });
  }
}
