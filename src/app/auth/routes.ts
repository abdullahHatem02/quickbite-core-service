import {Router} from "express";
import {TOKENS} from "../../lib/di/tokens";
import {container} from "../../lib/di/container";
import {AuthController} from "./controller/auth.controller";

export const authRouter = Router();

const authController = container.resolve<AuthController>(TOKENS.AuthController);

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/forget-password', authController.forgetPassword);
authRouter.post('/reset-password', authController.resetPassword);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/accept-invite', authController.acceptInvite);