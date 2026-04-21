import { config as loadEnvironment } from "dotenv";
import { type Knex } from "knex";

loadEnvironment();

const config: Knex.Config = {
  client: "pg",
  connection: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? "5432"),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  migrations: {
    directory: "./src/database/migrations",
    extension: "ts",
  },
};

export default config;
