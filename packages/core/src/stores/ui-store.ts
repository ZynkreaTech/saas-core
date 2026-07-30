import { create } from "zustand";

// Zustand is ONLY for throwaway UI state (is the sidebar open?) — never for
// data that came from the server. Server data always stays in TanStack Query
// (use-modules.ts above) so there is exactly one source of truth for it.
export const useUIStore = create<{
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
