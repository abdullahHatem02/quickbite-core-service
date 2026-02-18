import {Router} from "express";
import {authRouter} from "./app/auth/routes";
import {healthRouter} from "./app/health/health.routes";

export const routes = Router();

routes.use("/health", healthRouter);
// user
// auth
routes.use('/auth', authRouter);
// menu
// restaurant