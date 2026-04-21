import { type Knex } from "knex";

import { hashPassword } from "../../utils/hash.util";

const REQUIRED_ROLES = ["SuperAdmin", "Auditor", "Registrador"] as const;

export async function seed(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    // Clean dependent logs first to avoid foreign key conflicts.
    await trx("audit_logs").del();
    await trx("users").del();

    // Optional: insert roles if a dedicated roles table exists.
    const hasRolesTable = await trx.schema.hasTable("roles");
    if (hasRolesTable) {
      await trx("roles").del();
      await trx("roles").insert(REQUIRED_ROLES.map((role) => ({ name: role })));
    }

    const passwordHash = await hashPassword("Password123!");

    await trx("users").insert({
      username: "admin_fortress",
      email: "admin@fortress.com",
      password_hash: passwordHash,
      role: "SuperAdmin",
      last_login: null,
      last_ip: null,
    });
  });
}
