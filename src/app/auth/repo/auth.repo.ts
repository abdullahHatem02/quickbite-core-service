import { db } from "../../../common/knex/knex.ts";

export interface PasswordResetRow {
    id: number;
    user_id: number;
    otp_hash: string;
    expires_at: string;
    consumed_at: string | null;
    created_at: string;
}

const PASSWORD_RESET_COLUMNS = [
    "id", "user_id", "otp_hash", "expires_at", "consumed_at", "created_at",
];

export async function createPasswordReset(data: {
    user_id: number;
    otp_hash: string;
    expires_at: Date;
}): Promise<PasswordResetRow> {
    const [reset] = await db("password_resets").insert(data).returning(PASSWORD_RESET_COLUMNS);
    return reset;
}

export async function findLatestPasswordReset(userId: number): Promise<PasswordResetRow | undefined> {
    return db("password_resets")
        .select(PASSWORD_RESET_COLUMNS)
        .where({ user_id: userId })
        .whereNull("consumed_at")
        .orderBy("created_at", "desc")
        .first();
}

export async function consumePasswordReset(resetId: number): Promise<void> {
    await db("password_resets").where({ id: resetId }).update({
        consumed_at: db.fn.now(),
    });
}
