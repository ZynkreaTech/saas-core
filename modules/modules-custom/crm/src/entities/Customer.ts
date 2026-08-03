// Plain entity shape — swap for your actual ORM decorators (TypeORM/Drizzle/
// Prisma model) once the backend ORM choice is locked in. Kept framework-
// agnostic here so the module package doesn't force an ORM dependency on
// every consumer just to read its types.
export interface Customer {
  id: string; // UUID v7, per project's DB conventions
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}
