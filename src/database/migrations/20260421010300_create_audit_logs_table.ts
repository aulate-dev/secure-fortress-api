import { type Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("audit_logs", (table) => {
    table.increments("id").primary();
    table.string("event_type", 100).notNullable();
    table
      .integer("user_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.text("details").notNullable();
    table.string("ip_address", 64).notNullable();
    table.string("route", 255).notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("audit_logs");
}
