import type { ModuleContext } from "@zynkreatech/sdk";
import type { Customer } from "../entities/Customer";

// Services own business logic + data access; controllers stay thin and
// just translate HTTP <-> service calls. Keeping this split from day one
// means a future non-HTTP caller (a background job, a CLI) can reuse
// CustomerService without going through routes/api.ts at all.
export class CustomerService {
  constructor(private ctx: ModuleContext) {}

  async list(): Promise<Customer[]> {
    return this.ctx.api.get<Customer[]>("/crm/customers");
  }

  async create(
    input: Pick<Customer, "name" | "email" | "phone">,
  ): Promise<Customer> {
    return this.ctx.api.post<Customer>("/crm/customers", input);
  }
}
