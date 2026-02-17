import { db } from "../../../common/knex/knex.ts";

export interface AddressRow {
    id: number;
    user_id: number;
    label: string;
    text: string;
    lat: number;
    lng: number;
    is_default: boolean;
    created_at: string;
}

const ADDRESS_COLUMNS = [
    "id", "user_id", "label", "text", "lat", "lng", "is_default", "created_at",
];

export async function findAddressesByUserId(
    userId: number,
    offset: number,
    limit: number,
): Promise<AddressRow[]> {
    return db("customer_addresses").select(ADDRESS_COLUMNS).where({ user_id: userId }).offset(offset).limit(limit);
}

export async function findAddressById(id: number, userId: number): Promise<AddressRow | undefined> {
    return db("customer_addresses").select(ADDRESS_COLUMNS).where({ id, user_id: userId }).first();
}

export async function countAddressesByUserId(userId: number): Promise<number> {
    const result = await db("customer_addresses").where({ user_id: userId }).count("id as count").first();
    return Number(result?.count ?? 0);
}

export async function createAddress(data: {
    user_id: number;
    label: string;
    text: string;
    lat: number;
    lng: number;
    is_default: boolean;
}): Promise<AddressRow> {
    const [address] = await db("customer_addresses").insert(data).returning(ADDRESS_COLUMNS);
    return address;
}

export async function updateAddress(
    id: number,
    userId: number,
    data: Partial<{ label: string; text: string; lat: number; lng: number; is_default: boolean }>,
): Promise<AddressRow> {
    const [address] = await db("customer_addresses")
        .where({ id, user_id: userId })
        .update(data)
        .returning(ADDRESS_COLUMNS);
    return address;
}

export async function deleteAddress(id: number, userId: number): Promise<void> {
    await db("customer_addresses").where({ id, user_id: userId }).delete();
}

export async function clearDefaultAddress(userId: number): Promise<void> {
    await db("customer_addresses").where({ user_id: userId, is_default: true }).update({ is_default: false });
}
