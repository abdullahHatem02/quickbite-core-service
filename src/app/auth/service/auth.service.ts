import {
    findUserByEmail,
    createUser,
    updateUserPassword,
} from "../../users/repo/users.repo.ts";
import {
    createPasswordReset,
    findLatestPasswordReset,
    consumePasswordReset,
} from "../repo/auth.repo.ts";
import {
    hashPassword,
    comparePassword,
    createAccessToken,
    createRefreshToken,
    verifyRefreshToken,
    generateOtp,
    hashOtp,
} from "../auth.utils.ts";
import {
    UserAlreadyExistsError,
    IncorrectCredentialsError,
    InvalidOtpError,
    ExpiredOtpError,
} from "../auth.errors.ts";
import { sendEmail } from "../../../common/email/email.ts";

export async function register(data: {
    email: string;
    phone: string;
    name: string;
    password: string;
}) {
    const existing = await findUserByEmail(data.email);
    if (existing) throw new UserAlreadyExistsError();

    const password_hash = await hashPassword(data.password);

    const user = await createUser({
        email: data.email,
        phone: data.phone,
        name: data.name,
        password_hash,
        system_role: "customer",
    });

    const payload = { userId: user.id, email: user.email, role: user.system_role };
    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.name,
            systemRole: user.system_role,
            createdAt: user.created_at,
        },
    };
}

export async function login(data: { email: string; password: string }) {
    const user = await findUserByEmail(data.email);
    if (!user) throw new IncorrectCredentialsError();

    const match = await comparePassword(data.password, user.password_hash);
    if (!match) throw new IncorrectCredentialsError();

    const payload = { userId: user.id, email: user.email, role: user.system_role };
    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.name,
            systemRole: user.system_role,
        },
    };
}

export async function forgotPassword(data: { email: string }) {
    const user = await findUserByEmail(data.email);
    if (!user) return; // silent — don't reveal if email exists

    const otp = generateOtp();
    const otpHashed = hashOtp(otp);

    await createPasswordReset({
        user_id: user.id,
        otp_hash: otpHashed,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendEmail(
        user.email,
        "QuickBite — Password Reset OTP",
        `Your OTP is: ${otp}. It expires in 10 minutes.`,
    );
}

export async function resetPassword(data: {
    email: string;
    otp: string;
    newPassword: string;
}) {
    const user = await findUserByEmail(data.email);
    if (!user) throw new InvalidOtpError();

    const reset = await findLatestPasswordReset(user.id);
    if (!reset) throw new InvalidOtpError();

    const otpHashed = hashOtp(data.otp);
    if (otpHashed !== reset.otp_hash) throw new InvalidOtpError();

    if (new Date(reset.expires_at) < new Date()) throw new ExpiredOtpError();

    const newHash = await hashPassword(data.newPassword);
    await updateUserPassword(user.id, newHash);
    await consumePasswordReset(reset.id);
}

export async function refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = createAccessToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
    });

    return { accessToken };
}
