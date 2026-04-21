import { Router } from "express";

import { listAuditLogs, listUsers } from "../controllers/admin.controller";
import { authenticate, checkRole } from "../middlewares/auth.middleware";
import { enforceSessionTimeout } from "../middlewares/session-timeout.middleware";

const adminRouter = Router();

adminRouter.use(authenticate, enforceSessionTimeout, checkRole(["SuperAdmin"]));
adminRouter.get("/users", listUsers);
adminRouter.get("/audit-logs", listAuditLogs);

export { adminRouter };
