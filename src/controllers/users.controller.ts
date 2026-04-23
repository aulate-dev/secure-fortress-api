import { type Response } from "express";

import { database } from "../config/database";
import { type AuthenticatedRequest } from "../middlewares/auth.middleware";
import { AuthService, type UserRole } from "../services/auth.service";
import { logEvent } from "../services/audit.service";
import { hashPassword } from "../utils/hash.util";
import {
  requireEmail,
  requireNonEmptyString,
  requirePassword,
} from "../utils/validation.util";

const authService = new AuthService();

interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  last_login: Date | null;
  last_ip: string | null;
}

const normalizeRole = (value: unknown): UserRole => {
  const role = requireNonEmptyString(value, "role");
  if (role !== "SuperAdmin" && role !== "Auditor" && role !== "Registrador") {
    throw new Error("role must be one of SuperAdmin, Auditor, Registrador");
  }

  return role;
};

const parseUserId = (rawId: string): number | null => {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
};

const getRouteUserIdParam = (req: AuthenticatedRequest): string | undefined => {
  const raw = req.params.id;
  if (Array.isArray(raw)) {
    return raw[0];
  }

  return raw;
};

const getActorId = (req: AuthenticatedRequest): number | null => {
  if (!req.user?.sub) {
    return null;
  }

  return Number(req.user.sub);
};

export const listUsers = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const users = await database<UserRow>("users")
    .select("id", "username", "email", "role", "last_login", "last_ip")
    .orderBy("id", "asc");

  res.status(200).json({ users });
};

export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const actorId = getActorId(req);
    await logEvent({
      event_type: "USER_CREATED",
      user_id: actorId,
      target_id: createdUser.id,
      details: `User ${createdUser.username} (${createdUser.email}) created`,
      req,
    });

    res.status(201).json({ user: createdUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create user";
    if (message === "Email already registered") {
      res.status(409).json({ error: message });
      return;
    }

    res.status(400).json({ error: message });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = parseUserId(getRouteUserIdParam(req) ?? "");
    if (userId === null) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const patch: Partial<Pick<UserRow, "username" | "email" | "password_hash" | "role">> = {};

    if (body.username !== undefined) {
      patch.username = requireNonEmptyString(body.username, "username");
    }
    if (body.email !== undefined) {
      patch.email = requireEmail(body.email);
    }
    if (body.password !== undefined && body.password !== "") {
      patch.password_hash = await hashPassword(requirePassword(body.password));
    }
    if (body.role !== undefined) {
      patch.role = normalizeRole(body.role);
    }

    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    if (patch.email !== undefined) {
      const conflict = await database<UserRow>("users")
        .where({ email: patch.email })
        .whereNot({ id: userId })
        .first();
      if (conflict) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }
    }

    const updatedRows = (await database("users")
      .where({ id: userId })
      .update({
        ...patch,
        updated_at: new Date(),
      })
      .returning(["id", "username", "email", "role", "last_login", "last_ip"])) as UserRow[];

    const updatedUser = updatedRows[0];
    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const actorId = getActorId(req);
    await logEvent({
      event_type: "USER_UPDATED",
      user_id: actorId,
      target_id: updatedUser.id,
      details: `User ${updatedUser.username} (${updatedUser.email}) updated`,
      req,
    });

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update user";
    res.status(400).json({ error: message });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = parseUserId(getRouteUserIdParam(req) ?? "");
  if (userId === null) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const actorId = getActorId(req);
  if (actorId !== null && actorId === userId) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }

  const existing = await database<UserRow>("users").where({ id: userId }).first();
  if (!existing) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (existing.role === "SuperAdmin") {
    const countRows = (await database("users")
      .where({ role: "SuperAdmin" })
      .count<{ count: string }>("* as count")) as unknown as { count: string }[];
    const total = Number(countRows[0]?.count ?? 0);
    if (total <= 1) {
      res.status(400).json({ error: "Cannot delete the last SuperAdmin account" });
      return;
    }
  }

  await logEvent({
    event_type: "USER_DELETED",
    user_id: actorId,
    target_id: existing.id,
    details: `User ${existing.username} (${existing.email}) deleted`,
    req,
  });

  await database<UserRow>("users").where({ id: userId }).delete();

  res.status(200).json({ message: "User deleted" });
};
