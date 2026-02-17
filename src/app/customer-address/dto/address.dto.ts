import { z } from "zod";

export const createAddressDto = z.object({
    label: z.string().min(1),
    addressText: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
    isDefault: z.boolean().optional().default(false),
});

export const updateAddressDto = z.object({
    label: z.string().min(1).optional(),
    addressText: z.string().min(1).optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    isDefault: z.boolean().optional(),
});
