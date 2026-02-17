import type { Request, Response, NextFunction } from "express";
import { createAddressDto, updateAddressDto } from "../dto/address.dto.ts";
import { parsePagination } from "../../../common/pagination/pagination.ts";
import * as addressService from "../service/address.service.ts";

export async function listAddresses(req: Request, res: Response, next: NextFunction) {
    try {
        const pagination = parsePagination(req);
        const result = await addressService.listAddresses(req.user!.userId, pagination);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

export async function createAddress(req: Request, res: Response, next: NextFunction) {
    try {
        const data = createAddressDto.parse(req.body);
        const address = await addressService.addAddress(req.user!.userId, data);
        res.status(201).json({ message: "Address added", address });
    } catch (err) {
        next(err);
    }
}

export async function updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
        const addressId = Number(req.params.addressId);
        const data = updateAddressDto.parse(req.body);
        const address = await addressService.editAddress(req.user!.userId, addressId, data);
        res.status(200).json({ message: "Address updated", address });
    } catch (err) {
        next(err);
    }
}

export async function deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
        const addressId = Number(req.params.addressId);
        await addressService.removeAddress(req.user!.userId, addressId);
        res.status(200).json({ message: "Address deleted" });
    } catch (err) {
        next(err);
    }
}
