import type { ModuleContext } from "@zynkreatech/sdk";
import { CustomerService } from "../services/CustomerService";

// Controllers are the thing routes/api.ts binds HTTP verbs to. This stays
// framework-agnostic (no Express/Fastify types) so it can be adapted to
// whichever router the FastAPI-fronted BFF layer ends up using on the
// Next.js side (route handlers) without a rewrite.
export class CustomerController {
  private service: CustomerService;
  constructor(ctx: ModuleContext) {
    this.service = new CustomerService(ctx);
  }

  async index() {
    return this.service.list();
  }

  async store(input: { name: string; email: string; phone?: string }) {
    return this.service.create(input);
  }
}
