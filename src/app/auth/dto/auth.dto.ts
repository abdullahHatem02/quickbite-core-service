import { z } from "zod";

export const registerDto = z.object({
    email: z.email(),
    phone: z.string().min(1),
    name: z.string().min(1),
    password: z.string().min(6),
});

export const loginDto = z.object({
    email: z.email(),
    password: z.string().min(1),
});

export const forgotPasswordDto = z.object({
    email: z.email(),
});

export const resetPasswordDto = z.object({
    email: z.email(),
    otp: z.string().length(6),
    newPassword: z.string().min(6),
});

export const refreshDto = z.object({
    refreshToken: z.string().min(1),
});
