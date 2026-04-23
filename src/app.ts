import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";

import { database } from "./config/database";
import { validateCsrfSource } from "./middlewares/csrf.middleware";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { productRouter } from "./routes/product.routes";
import { auditRouter, usersRouter } from "./routes/rbac.routes";

const app = express();

// Extraemos los orígenes permitidos del .env
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) ?? [];

/**
 * RS-06 | Headers de Seguridad HTTP
 * helmet() configura automáticamente:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: SAMEORIGIN (Previene Clickjacking)
 * - Strict-Transport-Security (HSTS)
 * - Content-Security-Policy (CSP inicial)
 */
app.use(helmet());

/**
 * RS-04 y RS-05 | Configuración de CORS para Sesiones Seguras
 * Importante: Para usar credentials (cookies), origin NO puede ser "*"
 */
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      // Log extra para ver qué está recibiendo el backend exactamente
      console.log("CORS Request Origin:", origin);
      console.log("Allowed Origins:", allowedOrigins);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ Bloqueado por seguridad: El origen "${origin}" no está en ALLOWED_ORIGINS`);
        callback(new Error("CORS policy: This origin is not allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());

/**
 * RS-03 | Protección contra CSRF
 * Valida el header Origin o Referer en operaciones de escritura
 */
app.use(validateCsrfSource);

// Endpoint de salud para verificar conectividad con la DB (RF-01)
app.get("/health", async (_request: Request, response: Response, next: NextFunction) => {
  try {
    await database.raw("SELECT 1");
    response.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

// Rutas de la API (RF-07)
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/admin", adminRouter);
app.use("/api/users", usersRouter);
app.use("/api/audit", auditRouter);

// Manejo de Rutas No Encontradas (RF-06 registra esto como 404)
app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: "Route not found" });
});

/**
 * Manejador Global de Errores
 * Garantiza que el servidor no exponga stack traces sensibles al cliente
 */
app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  console.error(`[Server Error]: ${message}`);
  response.status(500).json({ error: "Internal Server Error" });
});

export default app;