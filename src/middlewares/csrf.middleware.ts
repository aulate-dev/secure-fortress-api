import { type NextFunction, type Request, type Response } from "express";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const parseAllowedOrigins = (): string[] => {
  const configured = process.env.ALLOWED_ORIGINS;
  if (!configured) {
    return [];
  }

  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

const isAllowedSource = (source: string, allowedOrigins: string[]): boolean => {
  if (allowedOrigins.length === 0) {
    return true;
  }

  return allowedOrigins.some((origin) => source.startsWith(origin));
};

export const validateCsrfSource = (req: Request, res: Response, next: NextFunction): void => {
  if (!WRITE_METHODS.has(req.method)) {
    next();
    return;
  }

  const allowedOrigins = parseAllowedOrigins();
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  const originIsValid = typeof origin === "string" && isAllowedSource(origin, allowedOrigins);
  const refererIsValid = typeof referer === "string" && isAllowedSource(referer, allowedOrigins);

  if (!originIsValid && !refererIsValid) {
    res.status(403).json({ error: "Blocked by CSRF protection policy" });
    return;
  }

  next();
};
