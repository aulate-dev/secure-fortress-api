import { Router } from "express";

import { listAuditLogs, listUsers } from "../controllers/admin.controller";
import { authenticate, authorizeRole } from "../middlewares/auth.middleware";
import { enforceSessionTimeout } from "../middlewares/session-timeout.middleware";

const adminRouter = Router();

adminRouter.use(authenticate, enforceSessionTimeout);
adminRouter.get("/users", authorizeRole(["SuperAdmin"]), listUsers);
adminRouter.get("/audit-logs", authorizeRole(["SuperAdmin", "Auditor"]), listAuditLogs);

export { adminRouter };
