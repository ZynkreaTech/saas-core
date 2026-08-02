import type { ModuleDefinition, ModuleDefinitionInput } from "./types";

// A thin identity function with a type brand. Its whole value is making
// every module author write the same shape and get TypeScript errors at
// authoring time (missing manifest, wrong hook signature) instead of a
// runtime crash inside ZynFlex three layers away.
export function defineModule(input: ModuleDefinitionInput): ModuleDefinition {
  return { __kind: "zynkrea-module", ...input };
}
 