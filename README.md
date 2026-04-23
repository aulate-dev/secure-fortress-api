# Secure Fortress API

Backend API built with Node.js, Express, TypeScript, Knex, and PostgreSQL for secure user and product management.

## Current Tech Stack

- Node.js + Express
- TypeScript
- PostgreSQL 15
- Knex (migrations and seeds)
- JWT authentication in HttpOnly cookie
- Bcrypt password hashing (cost 12)

## Security Features Implemented

- RBAC with roles: `SuperAdmin`, `Auditor`, `Registrador`
- Password hashing with `bcrypt` (salt rounds: 12)
- Login rate limiting per IP:
  - max 5 failed attempts
  - blocked for 5 minutes
- Session timeout after 5 minutes of inactivity
- CSRF protection for write operations using `Origin`/`Referer` validation
- Audit logging for:
  - login success/failure
  - access denied events
  - product create/update/delete actions
- Secure auth cookie:
  - `HttpOnly`
  - `Secure`
  - `SameSite=Strict`

## Main API Areas

- Auth routes: `/api/auth`
  - `POST /register`
  - `POST /login`
- Product routes: `/api/products`
  - CRUD with RBAC restrictions
- Admin routes: `/api/admin` (SuperAdmin only)
  - `GET /users`
  - `GET /audit-logs`

Detailed endpoint reference: see `README_API.md`.

## Project Structure (key files)

- `src/app.ts` - Express app setup and routes
- `src/index.ts` - server bootstrap
- `src/config/database.ts` - Knex DB connection
- `src/services/auth.service.ts` - register/login logic
- `src/services/audit.service.ts` - audit log writer
- `src/middlewares/auth.middleware.ts` - JWT auth + role checks
- `src/middlewares/session-timeout.middleware.ts` - inactivity timeout
- `src/middlewares/login-rate-limit.middleware.ts` - login anti-bruteforce
- `src/middlewares/csrf.middleware.ts` - CSRF header validation
- `src/database/migrations` - schema migrations
- `src/database/seeds/initial_setup.ts` - roles (si existe tabla `roles`) y usuarios de prueba (RF-05)
- `src/database/seeds/product_seeds.ts` - productos de ejemplo (RF-03)

## Environment Variables

Create a `.env` file from `.env.example`.

Required variables:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`
- `PORT` (optional, defaults to 3000 in runtime setup)

## Local Development

Install dependencies:

```bash
npm install
```

Run in dev mode:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run production build:

```bash
npm run start
```

## Database (Knex)

Run migrations:

```bash
npm run migrate:latest
```

Rollback last migration batch:

```bash
npm run migrate:rollback
```

### Seeds y reset de base de datos

Ejecutar solo los seeds (idempotentes; requiere migraciones aplicadas y PostgreSQL accesible con las variables de `DB_*` del `.env`):

```bash
npm run db:seed
```

**Reset completo** (rollback de migraciones, volver a aplicar el último estado y cargar seeds). Útil como “botón de pánico” en desarrollo; **no** usar en producción con datos reales:

```bash
npm run db:reset
```

El script `db:seed` usa `npx knex seed:run --knexfile knexfile.ts --esm`. Si `migrate:rollback` / `migrate:latest` del `db:reset` no encuentran el knexfile en tu entorno, puedes sustituirlos por `npm run migrate:rollback` y `npm run migrate:latest`, que ya incluyen `--knexfile knexfile.ts --esm`.

## Docker

This repository includes:

- `Dockerfile` (multi-stage build optimized for production)
- `docker-compose.yml` with:
  - API service on `3000`
  - PostgreSQL 15 on `5432`
  - persistent DB volume
  - DB healthcheck before API startup

Start containers:

```bash
npm run docker:up
```

### Migraciones y seeds con Docker

La imagen de producción del **API** solo arranca `node dist/index.js`: **no** ejecuta Knex ni seeds al iniciar (la imagen no incluye `knexfile.ts` ni el árbol `src/` necesario para el CLI con TypeScript).

Flujo recomendado:

1. Levanta la base con Compose (`db` expone `5432` en el host).
2. En el **host** (con el mismo repo y `npm install`), configura `.env` con `DB_HOST=127.0.0.1` y el resto de credenciales alineadas con `docker-compose.yml` (usuario, contraseña, base `secure_fortress`).
3. Aplica esquema y datos:

```bash
npm run migrate:latest
npm run db:seed
```

O, en desarrollo, un solo comando:

```bash
npm run db:reset
```

Así `db:seed` queda integrado en el flujo operativo (local / CI contra Postgres), sin acoplar seeds al arranque del contenedor API, que permanece delgado y orientado solo a servir HTTP.
