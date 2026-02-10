import {Router} from "express";
import {healthRouter} from "./app/health/health.routes.ts";

export const routes = Router();

routes.use("/health", healthRouter);
// user
// auth
// menu
// restaurant