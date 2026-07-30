"use client";
import { createContext, useContext } from "react";

// Holds "which tenant is the current user inside of" for every component
// below it in the tree. Every API call reads tenantId from here so data
// from one company can never leak into another company's screen.
const TenantContext = createContext<{
  tenantId: string;
  dbSchema: string;
} | null>(null);

export function TenantProvider({
  tenantId,
  dbSchema,
  children,
}: {
  tenantId: string;
  dbSchema: string;
  children: React.ReactNode;
}) {
  return (
    <TenantContext.Provider value={{ tenantId, dbSchema }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used inside TenantProvider");
  return ctx;
};
