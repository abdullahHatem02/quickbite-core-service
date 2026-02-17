import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.ts";
import * as authController from "./controller/auth.controller.ts";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/logout", authenticate, authController.logout);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);
authRouter.post("/refresh", authController.refresh);
