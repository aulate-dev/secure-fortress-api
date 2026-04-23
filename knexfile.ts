import { config as loadEnvironment } from "dotenv";
import { type Knex } from "knex";
import path from "path";

loadEnvironment();

const config: Knex.Config = {
  client: "pg",
  connection: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "",
  },
  migrations: {
    // Esto permite que funcione tanto en src/ (local) como en dist/ (docker)
    directory: process.env.NODE_ENV === 'production' 
      ? "./dist/database/migrations" 
      : "./src/database/migrations",
    extension: process.env.NODE_ENV === 'production' ? "js" : "ts",
  },
  seeds: {
    directory: process.env.NODE_ENV === 'production' 
      ? "./dist/database/seeds" 
      : "./src/database/seeds",
    extension: process.env.NODE_ENV === 'production' ? "js" : "ts",
  },
};

export default config;