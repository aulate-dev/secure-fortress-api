import { type Response } from "express";

import { database } from "../config/database";
import { type AuthenticatedRequest } from "../middlewares/auth.middleware";

export { listUsers } from "./users.controller";

export const listAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const role = req.user?.role;
  if (!role) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (role === "Registrador") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const logs = await database("audit_logs as al")
    .leftJoin("users as u", "u.id", "al.user_id")
    .select(
      "al.created_at as timestamp",
      "al.event_type",
      database.raw("COALESCE(u.username, 'Sistema') as username"),
      "al.ip_address",
      "al.details",
      database.raw(
        `CASE
          WHEN al.event_type LIKE 'ACCESS_DENIED%' OR al.event_type LIKE '%FAILED%'
            THEN 'FAILED'
          ELSE 'SUCCESS'
        END as status`,
      ),
    )
    .orderBy("al.created_at", "desc");

  res.status(200).json({ logs });
};
