import { type Request, type Response } from "express";

import { AuthService, type UserRole } from "../services/auth.service";
import {
  clearFailedLoginAttempts,
  registerFailedLoginAttempt,
} from "../middlewares/login-rate-limit.middleware";
import { type AuthenticatedRequest } from "../middlewares/auth.middleware";
import { getRequestIp, logEvent } from "../services/audit.service";
import { invalidateSession, registerSession } from "../services/session.service";
import { clearAuthCookie } from "../utils/auth-cookie.util";
import { requireEmail, requireNonEmptyString, requirePassword } from "../utils/validation.util";

const authService = new AuthService();

const normalizeRole = (value: unknown): UserRole => {
  const role = requireNonEmptyString(value, "role");
  if (role !== "SuperAdmin" && role !== "Auditor" && role !== "Registrador") {
    throw new Error("role must be one of SuperAdmin, Auditor, Registrador");
  }

  return role;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const username = requireNonEmptyString(req.body.username, "username");
    const email = requireEmail(req.body.email);
    const password = requirePassword(req.body.password);
    const role = normalizeRole(req.body.role);

    const createdUser = await authService.registerUser({
      username,
      email,
      password,
      role,
    });

    res.status(201).json({ user: createdUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not register user";
    res.status(400).json({ error: message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const email = requireEmail(req.body.email);
    const password = requirePassword(req.body.password);

    const loginResult = await authService.login({ email, password, req });

    // Regenerates the server-side session identifier at each login.
    registerSession(loginResult.user.id, loginResult.sessionId);
    clearFailedLoginAttempts(req);
    await logEvent({
      event_type: "LOGIN_SUCCESS",
      user_id: loginResult.user.id,
      details: "User authenticated successfully",
      req,
    });

    res.cookie("auth_token", loginResult.token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({
      user: loginResult.user,
      ipAddress: getRequestIp(req),
      message: "Login successful",
    });
  } catch (error) {
    await registerFailedLoginAttempt(req);
    const message = error instanceof Error ? error.message : "Login failed";
    res.status(401).json({ error: message });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.sub) {
      invalidateSession(Number(req.user.sub));
      await logEvent({
        event_type: "Logout Exitoso",
        user_id: Number(req.user.sub),
        details: "User logged out successfully",
        req,
      });
    }

    clearAuthCookie(res);
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Logout failed";
    res.status(500).json({ error: message });
  }
};

export const sessionContext = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user?.sub) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  res.status(200).json({
    id: Number(req.user.sub),
    email: req.user.email ?? "",
    username: req.user.username ?? "Usuario",
    sourceIp: getRequestIp(req),
    role: req.user.role,
  });
};
