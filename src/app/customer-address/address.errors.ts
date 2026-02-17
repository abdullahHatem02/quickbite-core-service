import { AppError } from "../../common/error/AppError.ts";

export class AddressNotFoundError extends AppError {
    constructor() {
        super("Address not found", 404);
    }
}

export class AddressLimitReachedError extends AppError {
    constructor() {
        super("Maximum number of addresses reached (10)", 400);
    }
}
