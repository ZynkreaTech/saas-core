import { z } from "zod";

// One schema, two jobs: (1) validates the tenant-registration form at
// runtime, (2) TypeScript infers the form's type from it below — so the
// validation rules and the TypeScript type can never drift apart.
export const tenantRegistrationSchema = z.object({
  companyName: z.string().min(2),
  adminEmail: z.string().email(),
  subdomain: z.string().regex(/^[a-z0-9-]+$/),
});
export type TenantRegistrationInput = z.infer<typeof tenantRegistrationSchema>;
