import { Router } from "express";

import { listAuditLogs } from "../controllers/admin.controller";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "../controllers/users.controller";
import { authenticate, authorizeRole } from "../middlewares/auth.middleware";
import { enforceSessionTimeout } from "../middlewares/session-timeout.middleware";

const usersRouter = Router();
usersRouter.use(authenticate, enforceSessionTimeout, authorizeRole(["SuperAdmin"]));
usersRouter.get("/", listUsers);
usersRouter.post("/", createUser);
usersRouter.put("/:id", updateUser);
usersRouter.delete("/:id", deleteUser);

const auditRouter = Router();
auditRouter.use(authenticate, enforceSessionTimeout, authorizeRole(["SuperAdmin", "Auditor"]));
auditRouter.get("/", listAuditLogs);

export { auditRouter, usersRouter };
