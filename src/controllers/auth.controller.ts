import { type Request, type Response } from "express";

import { AuthService, type UserRole } from "../services/auth.service";
import {
  clearFailedLoginAttempts,
  registerFailedLoginAttempt,
} from "../middlewares/login-rate-limit.middleware";
import { registerSession } from "../services/session.service";
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

    res.cookie("auth_token", loginResult.token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 2 * 60 * 60 * 1000,
    });

    res.status(200).json({
      user: loginResult.user,
      message: "Login successful",
    });
  } catch (error) {
    await registerFailedLoginAttempt(req);
    const message = error instanceof Error ? error.message : "Login failed";
    res.status(401).json({ error: message });
  }
};
