import { type NextFunction, type Request, type Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { getJwtSecret } from "../config/security";
import { logEvent } from "../services/audit.service";
import { type UserRole } from "../services/auth.service";

interface AuthenticatedUserPayload extends JwtPayload {
  sub: string;
  sid?: string;
  role: UserRole;
  email?: string;
  username?: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

const getCookieValue = (cookieHeader: string | undefined, cookieName: string): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((entry) => entry.trim());
  const cookie = cookies.find((entry) => entry.startsWith(`${cookieName}=`));
  if (!cookie) {
    return null;
  }

  const [, value] = cookie.split("=");
  return value ?? null;
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = getCookieValue(req.headers.cookie, "auth_token");
    if (!token) {
      await logEvent({
        event_type: "ACCESS_DENIED",
        user_id: null,
        details: "Authentication cookie not provided",
        req,
      });
      res.status(401).json({ error: "Authentication token not provided" });
      return;
    }

    const jwtSecret = getJwtSecret();

    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded === "string" || !decoded.role || !decoded.sub) {
      await logEvent({
        event_type: "ACCESS_DENIED",
        user_id: null,
        details: "Invalid authentication payload",
        req,
      });
      res.status(401).json({ error: "Invalid authentication payload" });
      return;
    }

    const normalizedPayload: AuthenticatedUserPayload = {
      ...decoded,
      sub: String(decoded.sub),
      role: decoded.role as UserRole,
    };
    req.user = normalizedPayload;
    next();
  } catch {
    await logEvent({
      event_type: "ACCESS_DENIED",
      user_id: null,
      details: "Invalid or expired authentication token",
      req,
    });
    res.status(401).json({ error: "Invalid or expired authentication token" });
  }
};

export const authorizeRole = (roles: UserRole[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      await logEvent({
        event_type: "ACCESS_DENIED",
        user_id: user?.sub ? Number(user.sub) : null,
        details: `Role denied. Required: ${roles.join(", ")}`,
        req,
      });

      res.status(403).json({ error: "Access denied" });
      return;
    }

    next();
  };
};

export const checkRole = authorizeRole;
export const authMiddleware = authenticate;

export const getCookieValueByName = getCookieValue;

export type { AuthenticatedRequest };
