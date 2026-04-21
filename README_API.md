# Secure Fortress API - Fase 1

## Autenticacion y sesion

### `POST /api/auth/register`
- Crea un usuario nuevo.
- Acceso sugerido: solo usuarios `SuperAdmin` (aplicarlo via rutas protegidas en despliegue).
- Body JSON:
```json
{
  "username": "admin01",
  "email": "admin@empresa.com",
  "password": "ClaveSegura123!",
  "role": "SuperAdmin"
}
```

### `POST /api/auth/login`
- Aplica rate limiting por IP:
  - 5 intentos fallidos maximos.
  - Bloqueo de 5 minutos.
- Body JSON:
```json
{
  "email": "admin@empresa.com",
  "password": "ClaveSegura123!"
}
```
- Respuesta exitosa:
  - HTTP 200.
  - Cookie `auth_token` configurada con:
    - `HttpOnly`
    - `Secure`
    - `SameSite=Strict`
    - `Max-Age=2h`
- La autenticacion usa JWT y session id regenerado por login (`sid` claim).

## Productos

### `GET /api/products`
- Roles permitidos: `SuperAdmin`, `Registrador`, `Auditor`.

### `GET /api/products/:id`
- Roles permitidos: `SuperAdmin`, `Registrador`, `Auditor`.

### `POST /api/products`
- Roles permitidos: `SuperAdmin`, `Registrador`.
- Body JSON:
```json
{
  "sku_alfanumerico": "SKU-1234",
  "nombre": "Laptop Segura",
  "descripcion": "Equipo cifrado para oficina",
  "cantidad": 10,
  "precio": 1599.99
}
```

### `PUT /api/products/:id`
- Roles permitidos: `SuperAdmin`, `Registrador`.
- Mismo formato de body que `POST`.

### `DELETE /api/products/:id`
- Roles permitidos: `SuperAdmin`, `Registrador`.

> Todas las operaciones de escritura sobre productos crean eventos en `audit_logs`.

## Administracion (solo SuperAdmin)

### `GET /api/admin/users`
- Muestra usuarios con:
  - `id`
  - `username`
  - `email`
  - `role`
  - `last_login`
  - `last_ip`

### `GET /api/admin/audit-logs`
- Retorna eventos del log de auditoria ordenados por fecha descendente.

## Seguridad aplicada

- RS-01: Persistencia con migraciones Knex (`users`, `products`, `audit_logs`).
- RS-03: validacion CSRF por `Origin`/`Referer` en metodos de escritura (`POST`, `PUT`, `PATCH`, `DELETE`).
- RS-04/RS-05: autenticacion con JWT en cookie segura HttpOnly.
- RS-07: auditoria de login exitoso y fallido.
- Session timeout: invalidacion de sesion tras 5 minutos de inactividad.
- RBAC: middleware `checkRole` para control de acceso por rol.

## Formato Token para pruebas

La API utiliza cookie `auth_token` como mecanismo principal.  
Si necesitas pruebas manuales en herramientas tipo Postman, copia la cookie recibida en login:

`Cookie: auth_token=<JWT>`

Claims principales del JWT:
- `sub`: id de usuario
- `role`: rol del usuario
- `email`: correo
- `sid`: identificador de sesion regenerado en login

## Variables de entorno requeridas

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `ALLOWED_ORIGINS` (lista separada por comas para validacion CSRF)

## Comandos utiles

- `npm run dev`
- `npm run build`
- `npm run migrate:latest`
- `npm run migrate:rollback`
