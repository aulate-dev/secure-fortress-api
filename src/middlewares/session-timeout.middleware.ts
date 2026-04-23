import { type NextFunction, type Response } from "express";

import { type AuthenticatedRequest } from "./auth.middleware";
import { invalidateSession, touchSession } from "../services/session.service";
import { clearAuthCookie } from "../utils/auth-cookie.util";

export const enforceSessionTimeout = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user?.sub || !req.user.sid) {
    res.status(401).json({ error: "Session is not valid" });
    return;
  }

  const userId = Number(req.user.sub);
  const sessionStatus = touchSession(userId, req.user.sid);
  if (sessionStatus === "ok") {
    next();
    return;
  }

  invalidateSession(userId);
  clearAuthCookie(res);
  res.status(401).json({ error: "Session expired due to inactivity" });
};
