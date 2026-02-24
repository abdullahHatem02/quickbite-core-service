import {Router} from "express";
import {authRouter} from "./app/auth/routes";
import {branchRouter} from "./app/branch/routes";
import {healthRouter} from "./app/health/health.routes";
import {restaurantRouter} from "./app/restaurant/routes";
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
routes.use('/restaurant',restaurantRouter)
routes.use('/',branchRouter)
