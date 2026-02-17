import type { Request, Response, NextFunction } from "express";
import { updateMeDto } from "../dto/users.dto.ts";
import * as usersService from "../service/users.service.ts";

export async function getMe(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await usersService.getMe(req.user!.userId);
        res.status(200).json(user);
    } catch (err) {
        next(err);
    }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
    try {
        const data = updateMeDto.parse(req.body);
        const user = await usersService.updateMe(req.user!.userId, data);
        res.status(200).json({ message: "Profile updated", user });
    } catch (err) {
        next(err);
    }
}
