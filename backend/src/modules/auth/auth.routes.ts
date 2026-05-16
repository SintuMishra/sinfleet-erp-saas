import { Router } from "express";
import { createRateLimit } from "../../middleware/rate-limit.js";
import { loginController, logoutController, meController, meGuards, refreshController } from "./auth.controller.js";

export const authRouter = Router();
const authRateLimit = createRateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: "auth" });

authRouter.post("/login", authRateLimit, loginController);
authRouter.post("/refresh", authRateLimit, refreshController);
authRouter.post("/logout", authRateLimit, logoutController);
authRouter.get("/me", ...meGuards, meController);
