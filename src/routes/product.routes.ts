import { Router } from "express";

import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "../controllers/product.controller";
import { authenticate, authorizeRole } from "../middlewares/auth.middleware";
import { validateProductPayload } from "../middlewares/product-validation.middleware";
import { enforceSessionTimeout } from "../middlewares/session-timeout.middleware";

const productRouter = Router();

productRouter.use(authenticate, enforceSessionTimeout);
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
