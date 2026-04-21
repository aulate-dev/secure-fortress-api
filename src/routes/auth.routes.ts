import { Router } from "express";

import { login, register } from "../controllers/auth.controller";
import { loginRateLimitGuard } from "../middlewares/login-rate-limit.middleware";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", loginRateLimitGuard, login);

export { authRouter };
