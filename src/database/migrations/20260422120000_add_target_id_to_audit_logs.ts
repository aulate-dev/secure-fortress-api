import { type Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("audit_logs", (table) => {
    table.integer("target_id").unsigned().nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("audit_logs", (table) => {
    table.dropColumn("target_id");
  });
}
