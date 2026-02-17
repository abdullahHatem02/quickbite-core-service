import { AppError } from "../../common/error/AppError.ts";

export class UserNotFoundError extends AppError {
    constructor() {
        super("User not found", 404);
    }
}
