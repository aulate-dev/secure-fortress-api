import { type NextFunction, type Request, type Response } from "express";

import { getRequestIp, logEvent } from "../services/audit.service";

interface FailedLoginState {
  attempts: number;
  blockedUntil: number | null;
}

const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_WINDOW_MS = 5 * 60 * 1000;
const failedAttemptsByIp = new Map<string, FailedLoginState>();

const getState = (ip: string): FailedLoginState => {
  return failedAttemptsByIp.get(ip) ?? { attempts: 0, blockedUntil: null };
};

export const loginRateLimitGuard = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const ip = getRequestIp(req);
  const state = getState(ip);
  const now = Date.now();

  if (state.blockedUntil && state.blockedUntil > now) {
    await logEvent({
      event_type: "LOGIN_RATE_LIMIT_BLOCKED",
      user_id: null,
      details: `Blocked login attempt from IP ${ip}`,
      req,
    });
    res.status(429).json({ error: "Too many failed attempts. Try again in 5 minutes." });
    return;
  }

  if (state.blockedUntil && state.blockedUntil <= now) {
    failedAttemptsByIp.delete(ip);
  }

  next();
};

export const registerFailedLoginAttempt = async (req: Request): Promise<void> => {
  const ip = getRequestIp(req);
  const previousState = getState(ip);
  const nextAttempts = previousState.attempts + 1;
  const shouldBlock = nextAttempts >= MAX_FAILED_ATTEMPTS;

  failedAttemptsByIp.set(ip, {
    attempts: shouldBlock ? 0 : nextAttempts,
    blockedUntil: shouldBlock ? Date.now() + BLOCK_WINDOW_MS : null,
  });

  if (shouldBlock) {
    await logEvent({
      event_type: "LOGIN_RATE_LIMIT_ACTIVATED",
      user_id: null,
      details: `IP ${ip} blocked for 5 minutes after ${MAX_FAILED_ATTEMPTS} failed logins`,
      req,
    });
  }
};

export const clearFailedLoginAttempts = (req: Request): void => {
  const ip = getRequestIp(req);
  failedAttemptsByIp.delete(ip);
};
