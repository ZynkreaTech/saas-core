import { QueryClient } from "@tanstack/react-query";

// One shared QueryClient instance so every consumer (saas-web today,
// saas-desktop later) uses identical caching rules instead of each
// re-inventing its own staleTime/gcTime settings.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute — safe default, tune per data type later
    },
  },
});
