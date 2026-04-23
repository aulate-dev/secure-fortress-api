import { Router, type NextFunction, type Response } from "express";

import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "../controllers/product.controller";
import { authenticate, authorizeRole, type AuthenticatedRequest } from "../middlewares/auth.middleware";
import { validateProductPayload } from "../middlewares/product-validation.middleware";
import { enforceSessionTimeout } from "../middlewares/session-timeout.middleware";

const productRouter = Router();

const blockAuditorWrites = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const isWriteMethod = req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS";
  if (req.user?.role === "Auditor" && isWriteMethod) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
};

productRouter.use(authenticate, enforceSessionTimeout);
productRouter.use(blockAuditorWrites);
productRouter.get("/", authorizeRole(["SuperAdmin", "Registrador", "Auditor"]), listProducts);
productRouter.get("/:id", authorizeRole(["SuperAdmin", "Registrador", "Auditor"]), getProductById);
productRouter.post("/", authorizeRole(["SuperAdmin", "Registrador"]), validateProductPayload, createProduct);
productRouter.put(
  "/:id",
  authorizeRole(["SuperAdmin", "Registrador", "Auditor"]),
  updateProduct,
);
productRouter.delete("/:id", authorizeRole(["SuperAdmin", "Registrador"]), deleteProduct);

export { productRouter };
