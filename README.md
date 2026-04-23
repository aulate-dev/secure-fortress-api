# Secure Fortress API

Backend API built with Node.js, Express, TypeScript, Knex, and PostgreSQL for secure user and product management.

## Tech Stack & Security
- **Stack:** Node.js, TypeScript, PostgreSQL 15, Knex.
- **Auth:** JWT en cookies `HttpOnly`, Hash BCrypt (12 rounds).
- **Protección:** RBAC (Roles), Rate Limiting (anti-brute force), CSRF protection y Audit Logging de acciones sensibles.

---

## 🚀 Guía de Configuración (Solo Docker)

Para garantizar que el entorno funcione correctamente, **todas las operaciones deben ejecutarse a través de Docker Compose**. 

### 1. Levantar el Entorno
Este comando construye la imagen de la API y levanta la base de datos:
```bash
docker-compose up -d --build
```

### 2. Inicializar Base de Datos (Tablas)
Crea la estructura de tablas necesaria. 
> **IMPORTANTE (Windows/Git Bash):** Es obligatorio usar el prefijo `MSYS_NO_PATHCONV=1` para que Docker reconozca correctamente las rutas internas.

```bash
MSYS_NO_PATHCONV=1 docker-compose exec api npx knex migrate:latest --client pg --connection 'postgres://secure_fortress_user:secure_fortress_password@db:5432/secure_fortress' --migrations-directory ./dist/database/migrations
```

### 3. Cargar Datos de Prueba (Seeds)
Este comando carga los roles, los 3 usuarios de auditoría y el inventario de productos:

```bash
MSYS_NO_PATHCONV=1 docker-compose exec api npx knex seed:run --client pg --connection 'postgres://secure_fortress_user:secure_fortress_password@db:5432/secure_fortress' --seeds-directory ./dist/database/seeds
```

---

## 🔐 Credenciales de Acceso

Tras ejecutar los comandos anteriores, utiliza estas cuentas para las pruebas de penetración y auditoría:

| Rol | Usuario | Email | Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin_fortress` | `admin@fortress.com` | `Secur3Seed!Admin2026` |
| **Auditor** | `auditor_fortress` | `auditor@fortress.com` | `Secur3Seed!Audit2026` |
| **Registrador** | `registrador_fortress` | `registrador@fortress.com` | `Secur3Seed!Reg2026` |

---

## 🛠️ Comandos de Mantenimiento (Docker)

- **Ver Logs del Sistema:**
  `docker-compose logs -f api`
- **Reset Total (Limpiar base de datos y reiniciar):**
  `docker-compose down -v && docker-compose up -d`
- **Inspección de Base de Datos:**
  `docker-compose exec db psql -U secure_fortress_user -d secure_fortress`

---

> **⚠️ Nota Técnica:** No es necesario realizar `npm install` ni tener Node instalado en el host; la imagen de Docker gestiona todas las dependencias y la compilación de TypeScript de forma interna.