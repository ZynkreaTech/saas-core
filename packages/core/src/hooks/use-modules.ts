import { useQuery } from "@tanstack/react-query";

// Fetches the list of modules THIS tenant is actually subscribed to.
// queryKey includes tenantId so switching tenants never shows stale/cached
// data from a different company.
export function useModules(tenantId: string) {
  return useQuery({
    queryKey: ["modules", tenantId],
    queryFn: () =>
      fetch(`/api/tenants/${tenantId}/modules`).then((r) => r.json()),
  });
}
