export interface Lead {
  id: string;
  tenantId: string;
  customerId: string;
  status: "new" | "contacted" | "qualified" | "won" | "lost";
  source?: string;
  createdAt: string;
  updatedAt: string;
}
