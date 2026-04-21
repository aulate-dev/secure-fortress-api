import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";

import { database } from "./config/database";
import { validateCsrfSource } from "./middlewares/csrf.middleware";
import { adminRouter } from "./routes/admin.routes";
import { authRouter } from "./routes/auth.routes";
import { productRouter } from "./routes/product.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(validateCsrfSource);

app.get("/health", async (_request: Request, response: Response, next: NextFunction) => {
  try {
    await database.raw("SELECT 1");
    response.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/admin", adminRouter);

app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: "Route not found" });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  response.status(500).json({ error: message });
});

export default app;
