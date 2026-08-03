"use client";
import { useEffect, useState } from "react";
import { CustomerService } from "../../services/CustomerService";
import type { Customer } from "../../entities/Customer";
import type { ModuleContext } from "@zynkreatech/sdk";

export default function CustomerListPage({ ctx }: { ctx: ModuleContext }) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    new CustomerService(ctx)
      .list()
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, [ctx]);

  return (
    <div>
      <h1>Customers Mapping</h1>
      <ul>
        {customers.map((c) => (
          <li key={c.id}>
            {c.name} — {c.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
