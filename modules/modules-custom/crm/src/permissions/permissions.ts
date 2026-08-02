import type { ModulePermission } from "@zynkreatech/sdk";

export const permissions: ModulePermission[] = [
  { id: "crm.customer.read", label: "View customers" },
  { id: "crm.customer.write", label: "Create/edit customers" },
  { id: "crm.lead.read", label: "View leads" },
  { id: "crm.lead.write", label: "Update lead status" },
];
