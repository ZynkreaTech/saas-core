"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { makeQueryClient } from "../lib/query-client";

// useState's initializer runs once per component instance — this creates
// exactly one QueryClient per browser session, never shared across users,
// and never crosses the server→client boundary as a prop.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => makeQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
