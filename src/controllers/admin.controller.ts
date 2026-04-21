import { type Response } from "express";

import { database } from "../config/database";
import { type AuthenticatedRequest } from "../middlewares/auth.middleware";

export const listUsers = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const users = await database("users")
    .select("id", "username", "email", "role", "last_login", "last_ip")
    .orderBy("id", "asc");

  res.status(200).json({ users });
};

export const listAuditLogs = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const logs = await database("audit_logs")
    .select("*")
    .orderBy("created_at", "desc");

  res.status(200).json({ logs });
};
