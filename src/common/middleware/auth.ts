import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../app/auth/auth.utils.ts";
import { AppError } from "../error/AppError.ts";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        throw new AppError("Missing or invalid authorization header", 401);
    }

    const token = header.split(" ")[1];
    const payload = verifyAccessToken(token);

    req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
    };

    next();
}
