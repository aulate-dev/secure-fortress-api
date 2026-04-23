import { type Response } from "express";

export const clearAuthCookie = (res: Response): void => {
  res.cookie("auth_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    expires: new Date(0),
    maxAge: 0,
  });
};
