import {Router} from "express";
import {healthRouter} from "./app/health/health.routes.ts";
import {authRouter} from "./app/auth/auth.routes.ts";
import {usersRouter} from "./app/users/users.routes.ts";
import {addressRouter} from "./app/customer-address/address.routes.ts";

export const routes = Router();

routes.use("/health", healthRouter);
routes.use("/auth", authRouter);
routes.use("/users", usersRouter);
routes.use("/customer/addresses", addressRouter);
// menu
// restaurant