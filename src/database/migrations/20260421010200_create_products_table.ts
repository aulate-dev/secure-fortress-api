import { type Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("products", (table) => {
    table.increments("id").primary();
    table.string("sku_alfanumerico", 80).notNullable().unique();
    table.string("nombre", 150).notNullable();
    table.text("descripcion").notNullable();
    table.integer("cantidad").notNullable().defaultTo(0);
    table.decimal("precio", 12, 2).notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("products");
}
