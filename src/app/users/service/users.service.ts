import { findUserById, updateUser } from "../repo/users.repo.ts";
import { UserNotFoundError } from "../users.errors.ts";

export async function getMe(userId: number) {
    const user = await findUserById(userId);
    if (!user) throw new UserNotFoundError();

    return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        systemRole: user.system_role,
    };
}

export async function updateMe(userId: number, data: { name?: string; phone?: string }) {
    const user = await findUserById(userId);
    if (!user) throw new UserNotFoundError();

    const updated = await updateUser(userId, data);

    return {
        id: updated.id,
        email: updated.email,
        phone: updated.phone,
        name: updated.name,
        systemRole: updated.system_role,
    };
}
