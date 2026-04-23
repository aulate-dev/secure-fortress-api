import { Router } from "express";

import { login, logout, register, sessionContext } from "../controllers/auth.controller";
import { authMiddleware, authenticate } from "../middlewares/auth.middleware";
import { loginRateLimitGuard } from "../middlewares/login-rate-limit.middleware";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", loginRateLimitGuard, login);
authRouter.post("/logout", authenticate, logout);
authRouter.get("/session-context", authMiddleware, sessionContext);

export { authRouter };
