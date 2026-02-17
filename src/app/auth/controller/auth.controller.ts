import type { Request, Response, NextFunction } from "express";
import { registerDto, loginDto, forgotPasswordDto, resetPasswordDto, refreshDto } from "../dto/auth.dto.ts";
import * as authService from "../service/auth.service.ts";

export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const data = registerDto.parse(req.body);
        const result = await authService.register(data);
        res.status(201).json({ message: "Registered successfully", ...result });
    } catch (err) {
        next(err);
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const data = loginDto.parse(req.body);
        const result = await authService.login(data);
        res.status(200).json({ message: "Login successful", ...result });
    } catch (err) {
        next(err);
    }
}

export async function logout(_req: Request, res: Response) {
    res.status(200).json({ message: "Logged out successfully" });
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const data = forgotPasswordDto.parse(req.body);
        await authService.forgotPassword(data);
        res.status(200).json({ message: "Reset email sent if account exists" });
    } catch (err) {
        next(err);
    }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
        const data = resetPasswordDto.parse(req.body);
        await authService.resetPassword(data);
        res.status(200).json({ message: "Password reset successful" });
    } catch (err) {
        next(err);
    }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
    try {
        const data = refreshDto.parse(req.body);
        const tokens = await authService.refresh(data.refreshToken);
        res.status(200).json(tokens);
    } catch (err) {
        next(err);
    }
}
