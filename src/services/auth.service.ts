import { type Request } from "express";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

import { database } from "../config/database";
import { getJwtSecret } from "../config/security";
import { comparePassword, hashPassword } from "../utils/hash.util";
import { getRequestIp, logEvent } from "./audit.service";

export type UserRole = "SuperAdmin" | "Auditor" | "Registrador";

interface UserRecord {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  last_login: Date | null;
  last_ip: string | null;
}

interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
  req: Request;
}

interface LoginResult {
  token: string;
  sessionId: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: UserRole;
  };
}

const buildInvalidCredentialsError = (): Error => {
  return new Error("Invalid email or password");
};

export class AuthService {
  async registerUser({
    username,
    email,
    password,
    role,
  }: RegisterUserInput): Promise<Omit<UserRecord, "password_hash">> {
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await database<UserRecord>("users")
      .where({ email: normalizedEmail })
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const passwordHash = await hashPassword(password);

    const [createdUser] = await database<UserRecord>("users")
      .insert({
        username: normalizedUsername,
        email: normalizedEmail,
        password_hash: passwordHash,
        role,
      })
      .returning(["id", "username", "email", "role", "last_login", "last_ip"]);

    if (!createdUser) {
      throw new Error("Failed to create user");
    }

    return createdUser;
  }

  async login({ email, password, req }: LoginInput): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await database<UserRecord>("users")
      .where({ email: normalizedEmail })
      .first();

    if (!user) {
      await logEvent({
        event_type: "LOGIN_FAILED",
        user_id: null,
        details: `Failed login attempt for email ${normalizedEmail}`,
        req,
      });
      throw buildInvalidCredentialsError();
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      await logEvent({
        event_type: "LOGIN_FAILED",
        user_id: user.id,
        details: "Invalid password",
        req,
      });
      throw buildInvalidCredentialsError();
    }

    const jwtSecret = getJwtSecret();

    const sessionId = randomUUID();
    const currentIp = getRequestIp(req);
    await database<UserRecord>("users")
      .where({ id: user.id })
      .update({
        last_login: new Date(),
        last_ip: currentIp,
      });

    const token = jwt.sign(
      {
        sub: String(user.id),
        username: user.username,
        role: user.role,
        email: user.email,
        sid: sessionId,
      },
      jwtSecret,
      { expiresIn: "1h" },
    );

    await logEvent({
      event_type: "LOGIN_SUCCESS",
      user_id: user.id,
      details: "User authenticated successfully",
      req,
    });

    return {
      token,
      sessionId,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}
