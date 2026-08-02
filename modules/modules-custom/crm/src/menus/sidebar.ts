import type { ModuleMenuItem } from "@zynkreatech/sdk";

export const sidebarMenus: ModuleMenuItem[] = [
  { id: "crm", label: "CRM", href: "/crm", order: 20 },
  {
    id: "crm.leads",
    label: "Leads",
    href: "/crm/leads",
    order: 21,
    parentId: "crm",
  },
];
