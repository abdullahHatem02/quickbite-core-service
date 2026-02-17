import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { env } from "../../common/config/env.ts";

export interface JwtPayload {
    userId: number;
    email: string;
    role: string;
}

export function createAccessToken(payload: JwtPayload): string {
    const options: SignOptions = { expiresIn: env.jwt.accessExpiresIn as unknown as SignOptions["expiresIn"] };
    return jwt.sign(payload, env.jwt.accessSecret, options);
}

export function createRefreshToken(payload: JwtPayload): string {
    const options: SignOptions = { expiresIn: env.jwt.refreshExpiresIn as unknown as SignOptions["expiresIn"] };
    return jwt.sign(payload, env.jwt.refreshSecret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
}

export function hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
}
