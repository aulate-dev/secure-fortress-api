import { config as loadEnvironment } from "dotenv";
import { knex, type Knex } from "knex";

loadEnvironment();

const {
  DB_HOST = "127.0.0.1",
  DB_PORT = "5432",
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

const getRequiredEnvVariable = (name: "DB_USER" | "DB_PASSWORD" | "DB_NAME"): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const dbUser = DB_USER ?? getRequiredEnvVariable("DB_USER");
const dbPassword = DB_PASSWORD ?? getRequiredEnvVariable("DB_PASSWORD");
const dbName = DB_NAME ?? getRequiredEnvVariable("DB_NAME");

const databaseConfig: Knex.Config = {
  client: "pg",
  connection: {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: dbUser,
    password: dbPassword,
    database: dbName,
  },
  pool: {
    min: 0,
    max: 10,
  },
};

export const database = knex(databaseConfig);
