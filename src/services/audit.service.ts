import { type Request } from "express";

import { database } from "../config/database";

interface AuditEventInput {
  event_type: string;
  user_id: number | null;
  details: string;
  req: Request;
}

export const getRequestIp = (req: Request): string => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    const firstIp = forwardedFor.split(",")[0];
    return firstIp ? firstIp.trim() : "unknown";
  }

  return req.ip || req.socket.remoteAddress || "unknown";
};

export const logEvent = async ({
  event_type,
  user_id,
  details,
  req,
}: AuditEventInput): Promise<void> => {
  await database("audit_logs").insert({
    event_type,
    user_id,
    details,
    ip_address: getRequestIp(req),
    route: req.originalUrl,
    created_at: new Date(),
  });
};
