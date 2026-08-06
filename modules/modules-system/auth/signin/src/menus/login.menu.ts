export interface ModuleMenuEntry {
  title: string;
  href: string;
}

// Login is a public-route module — it has no entry inside the authenticated
// app shell's sidebar, so this is intentionally empty. Still exported so
// every module's shape stays uniform for the loader (Section 7), which
// expects a `menu` array to exist even when it's empty.
export const loginMenu: ModuleMenuEntry[] = [];
