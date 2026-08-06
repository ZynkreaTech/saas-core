import { z } from "zod";

// One schema drives both the runtime validation and the TypeScript type —
// same pattern as packages/core/src/schemas/tenant-registration.schema.ts.
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantSubdomain: z.string().regex(/^[a-z0-9-]+$/),
});
export type LoginCredentials = z.infer<typeof loginSchema>;
