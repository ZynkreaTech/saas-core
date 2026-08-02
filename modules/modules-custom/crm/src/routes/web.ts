// import type { ModuleRoute } from "@zynkreatech/sdk";
// import CustomerListPage from "../ui/pages/CustomerListPage";
// import LeadBoardPage from "../ui/pages/LeadBoardPage";

// // Frontend routes only — these are what ZynFlex's [moduleId]/[[...rest]]
// // catch-all resolves against. Path is relative to the module's own segment
// // ("/crm/..."), matching the pattern from the billing example.
// export const webRoutes: ModuleRoute[] = [
//   { path: "", component: CustomerListPage, exact: true },
//   { path: "leads", component: LeadBoardPage },
// ];

import type { ModuleRoute } from "@zynkreatech/sdk";

// Dynamic import()s instead of static imports — CustomerListPage.tsx and
// LeadBoardPage.tsx are now ONLY reachable at call time, never bundled
// into index.mjs's static import graph.
export const webRoutes: ModuleRoute[] = [
  {
    path: "",
    component: () => import("../ui/pages/CustomerListPage"),
    exact: true,
  },
  { path: "leads", component: () => import("../ui/pages/LeadBoardPage") },
];