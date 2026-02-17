import { db } from "../../../common/knex/knex.ts";

export interface UserRow {
    id: number;
    email: string;
    phone: string;
    name: string;
    password_hash: string;
    system_role: string;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

const USER_COLUMNS = [
    "id", "email", "phone", "name", "password_hash",
    "system_role", "deleted_at", "created_at", "updated_at",
];

export async function findUserById(id: number): Promise<UserRow | undefined> {
    return db("users").select(USER_COLUMNS).where({ id }).whereNull("deleted_at").first();
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
    return db("users").select(USER_COLUMNS).where({ email }).whereNull("deleted_at").first();
}

export async function createUser(data: {
    email: string;
    phone: string;
    name: string;
    password_hash: string;
    system_role: string;
}): Promise<UserRow> {
    const [user] = await db("users").insert(data).returning(USER_COLUMNS);
    return user;
}

export async function updateUser(
    id: number,
    data: { name?: string; phone?: string },
): Promise<UserRow> {
    const [user] = await db("users")
        .where({ id })
        .update({ ...data, updated_at: db.fn.now() })
        .returning(USER_COLUMNS);
    return user;
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
    await db("users").where({ id: userId }).update({
        password_hash: passwordHash,
        updated_at: db.fn.now(),
    });
}
