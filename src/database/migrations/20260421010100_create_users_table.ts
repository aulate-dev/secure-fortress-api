import { type Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("username", 100).notNullable();
    table.string("email", 190).notNullable().unique();
    table.string("password_hash", 255).notNullable();
    table
      .enu("role", ["SuperAdmin", "Auditor", "Registrador"], {
        useNative: true,
        enumName: "user_role",
      })
      .notNullable();
    table.timestamp("last_login", { useTz: true }).nullable();
    table.string("last_ip", 64).nullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
  await knex.raw("DROP TYPE IF EXISTS user_role");
}
