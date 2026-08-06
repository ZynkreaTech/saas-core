import type { ComponentType } from "react";


export interface ModuleRoute<
  P extends Record<string, unknown> = Record<string, unknown>,
> {
  path: string;
  component: () => Promise<{ default: ComponentType<P> }>;
}

// Route contribution — path this module owns + a lazy loader for its
// component. `component` is a function (not a direct import) so route-level
// code splitting works, same rule as every other module.
export const loginRoutes: ModuleRoute[] = [
  {
    path: "/signin",
    component: () => import("../ui/LoginPage"),
  },
];
