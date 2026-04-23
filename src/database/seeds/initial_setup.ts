import { type Knex } from "knex";
import { hashPassword } from "../../utils/hash.util";

const ROLE_NAMES = ["SuperAdmin", "Auditor", "Registrador"] as const;
type UserRole = (typeof ROLE_NAMES)[number];

const SEED_USERS: ReadonlyArray<{
  username: string;
  email: string;
  role: UserRole;
  plainPassword: string;
}> = [
  {
    username: "admin_fortress",
    email: "admin@fortress.com",
    role: "SuperAdmin",
    plainPassword: "Secur3Seed!Admin2026",
  },
  {
    username: "auditor_fortress",
    email: "auditor@fortress.com",
    role: "Auditor",
    plainPassword: "Secur3Seed!Audit2026",
  },
  {
    username: "registrador_fortress",
    email: "registrador@fortress.com",
    role: "Registrador",
    plainPassword: "Secur3Seed!Reg2026",
  },
];

export async function seed(knex: Knex): Promise<void> {
  // 1. Asegurar Roles
  const hasRolesTable = await knex.schema.hasTable("roles");
  if (hasRolesTable) {
    for (const name of ROLE_NAMES) {
      const exists = await knex("roles").where({ name }).first();
      if (!exists) {
        await knex("roles").insert({ name });
        console.log(`[initial_setup] Rol insertado: ${name}`);
      }
    }
  }

  // 2. Insertar/Actualizar Usuarios con Hash
  for (const user of SEED_USERS) {
    const email = user.email.trim().toLowerCase();
    
    // Generamos el hash de seguridad
    const passwordHash = await hashPassword(user.plainPassword);

    await knex("users")
      .insert({
        username: user.username.trim(),
        email,
        password_hash: passwordHash, // <-- Verifica que este sea el nombre en tu esquema
        role: user.role,
        last_login: null,
        last_ip: null,
      })
      .onConflict("email") // Si el email ya existe, sobreescribimos con el nuevo hash
      .merge({
        username: user.username.trim(),
        role: user.role,
        password_hash: passwordHash,
        updated_at: knex.fn.now(),
      });

    console.log(`[initial_setup] Usuario listo con HASH: ${email} (${user.role})`);
  }
}