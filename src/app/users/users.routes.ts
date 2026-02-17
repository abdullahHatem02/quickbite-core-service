import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.ts";
import * as usersController from "./controller/users.controller.ts";

export const usersRouter = Router();

usersRouter.use(authenticate);

usersRouter.get("/me", usersController.getMe);
usersRouter.patch("/me", usersController.updateMe);
