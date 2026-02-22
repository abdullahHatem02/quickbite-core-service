import {Router} from "express";
import {authRouter} from "./app/auth/routes";
import {healthRouter} from "./app/health/health.routes";
import {userRouter} from "./app/user/routes";
import {customerAddressRouter} from "./app/customer-address/routes";

export const routes = Router();

routes.use("/health", healthRouter);
// user
routes.use('/user', userRouter)
// auth
routes.use('/auth', authRouter);
// customer addresses
routes.use('/customer/addresses', customerAddressRouter);
// menu
// restaurant
