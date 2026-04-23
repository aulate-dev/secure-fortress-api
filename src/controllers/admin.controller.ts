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

  const logs = await database("audit_logs as sl")
    .leftJoin("users as u", "u.id", "sl.user_id")
    .select(
      "sl.created_at as timestamp",
      "sl.event_type",
      database.raw("CASE WHEN sl.user_id IS NULL THEN 'Intento Fallido' ELSE COALESCE(u.username, 'Desconocido') END as username"),
      "sl.ip_address",
      "sl.details",
      database.raw(
        `CASE
          WHEN sl.event_type LIKE 'ACCESS_DENIED%' OR sl.event_type LIKE '%FAILED%'
            THEN 'FAILED'
          ELSE 'SUCCESS'
        END as status`,
      ),
    )
    .orderBy("sl.created_at", "desc");

  res.status(200).json({ logs });
};
