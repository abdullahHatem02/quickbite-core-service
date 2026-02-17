import { AppError } from "../../common/error/AppError.ts";

export class UserAlreadyExistsError extends AppError {
    constructor() {
        super("User with this email already exists", 409);
    }
}

export class IncorrectCredentialsError extends AppError {
    constructor() {
        super("Incorrect email or password", 401);
    }
}

export class InvalidOtpError extends AppError {
    constructor() {
        super("Invalid OTP", 400);
    }
}

export class ExpiredOtpError extends AppError {
    constructor() {
        super("OTP has expired", 400);
    }
}
