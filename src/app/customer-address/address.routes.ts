import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.ts";
import * as addressController from "./controller/address.controller.ts";

export const addressRouter = Router();

addressRouter.use(authenticate);

addressRouter.get("/", addressController.listAddresses);
addressRouter.post("/", addressController.createAddress);
addressRouter.patch("/:addressId", addressController.updateAddress);
addressRouter.delete("/:addressId", addressController.deleteAddress);
