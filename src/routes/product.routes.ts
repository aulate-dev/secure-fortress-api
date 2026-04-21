import { Router } from "express";

import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "../controllers/product.controller";
import { authenticate, checkRole } from "../middlewares/auth.middleware";
import { enforceSessionTimeout } from "../middlewares/session-timeout.middleware";

const productRouter = Router();

productRouter.use(authenticate, enforceSessionTimeout);
productRouter.get("/", checkRole(["SuperAdmin", "Registrador", "Auditor"]), listProducts);
productRouter.get("/:id", checkRole(["SuperAdmin", "Registrador", "Auditor"]), getProductById);
productRouter.post("/", checkRole(["SuperAdmin", "Registrador"]), createProduct);
productRouter.put("/:id", checkRole(["SuperAdmin", "Registrador"]), updateProduct);
productRouter.delete("/:id", checkRole(["SuperAdmin", "Registrador"]), deleteProduct);

export { productRouter };
