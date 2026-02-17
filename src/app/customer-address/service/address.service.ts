import {
    findAddressesByUserId,
    findAddressById,
    countAddressesByUserId,
    createAddress,
    updateAddress,
    deleteAddress,
    clearDefaultAddress,
    type AddressRow,
} from "../repo/address.repo.ts";
import { AddressNotFoundError, AddressLimitReachedError } from "../address.errors.ts";
import { paginationMeta, type PaginationQuery } from "../../../common/pagination/pagination.ts";

const MAX_ADDRESSES = 10;

function formatAddress(row: AddressRow) {
    return {
        id: row.id,
        label: row.label,
        addressText: row.text,
        lat: row.lat,
        lng: row.lng,
        isDefault: row.is_default,
    };
}

export async function listAddresses(userId: number, pagination: PaginationQuery) {
    const offset = (pagination.page - 1) * pagination.limit;
    const [rows, total] = await Promise.all([
        findAddressesByUserId(userId, offset, pagination.limit),
        countAddressesByUserId(userId),
    ]);
    return {
        data: rows.map(formatAddress),
        pagination: paginationMeta(pagination.page, pagination.limit, total),
    };
}

export async function addAddress(
    userId: number,
    data: { label: string; addressText: string; lat: number; lng: number; isDefault: boolean },
) {
    const count = await countAddressesByUserId(userId);
    if (count >= MAX_ADDRESSES) throw new AddressLimitReachedError();

    if (data.isDefault) {
        await clearDefaultAddress(userId);
    }

    const row = await createAddress({
        user_id: userId,
        label: data.label,
        text: data.addressText,
        lat: data.lat,
        lng: data.lng,
        is_default: data.isDefault,
    });
    return formatAddress(row);
}

export async function editAddress(
    userId: number,
    addressId: number,
    data: Partial<{ label: string; addressText: string; lat: number; lng: number; isDefault: boolean }>,
) {
    const existing = await findAddressById(addressId, userId);
    if (!existing) throw new AddressNotFoundError();

    if (data.isDefault) {
        await clearDefaultAddress(userId);
    }

    const dbData: Partial<{ label: string; text: string; lat: number; lng: number; is_default: boolean }> = {};
    if (data.label !== undefined) dbData.label = data.label;
    if (data.addressText !== undefined) dbData.text = data.addressText;
    if (data.lat !== undefined) dbData.lat = data.lat;
    if (data.lng !== undefined) dbData.lng = data.lng;
    if (data.isDefault !== undefined) dbData.is_default = data.isDefault;

    const row = await updateAddress(addressId, userId, dbData);
    return formatAddress(row);
}

export async function removeAddress(userId: number, addressId: number) {
    const existing = await findAddressById(addressId, userId);
    if (!existing) throw new AddressNotFoundError();

    await deleteAddress(addressId, userId);
}
