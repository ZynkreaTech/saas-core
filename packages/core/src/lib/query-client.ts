import { QueryClient } from "@tanstack/react-query";

// A factory, not a shared instance — each browser session (and each
// server request) gets its own QueryClient. A single shared instance on
// the server would leak cached data between different users' requests.
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}
