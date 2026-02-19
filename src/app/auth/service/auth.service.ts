import {SystemRole} from "../../user/enums";
import {
    findUserExistsByEmailOrPhone,
    createUser,
    findUserByEmail,
    findUserExistsByEmail, updateUserPassword
} from "../../user/repository/users.repo";
import {RegisterDTO, LoginDTO, ForgetPasswordDTO, ResetPasswordDTO} from "../dto/auth.dto";
import {UserAlreadyExistsError, CannotSignupAsSystemAdmin, IncorrectCredentials, InvalidOTPError} from "../errors";
import {
    createPasswordReset,
    findLatestPasswordResetByUserId,
    updatePasswordResetConsumedAt
} from "../repository/password-reset.repo";
import {hashPassword, createAccessToken, createRefreshToken, comparePassword, generateOTP, hashOTP} from "../utils";

export class AuthService {
    register = async(data: RegisterDTO )=> {
        if (data.role == SystemRole.SYSTEM_ADMIN) {
            throw CannotSignupAsSystemAdmin
        }
        // 1. check if user exists by email
        const existing = await findUserExistsByEmailOrPhone(data.email, data.phone);

        // 2. if exists we throw an error
        if(existing) {
            throw UserAlreadyExistsError
        }
        // 3. hashPassword
        const hashedPassword = await hashPassword(data.password);

        // 4. create user
        const now = new Date();
        const user = await createUser({
            email: data.email,
            phone: data.phone,
            name: data.name,
            passwordHash: hashedPassword,
            systemRole: data.role,
            createdAt: now,
            updatedAt: now,
        })

        // 5. create access token , refresh token
        const payload = {userId: user.id, role: data.role, email: user.email};
        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);

        // 6. return tokens and user data
        return {
            message: "successfully registered user",
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                systemRole: user.systemRole,
                createdAt: user.createdAt,
            }
        }
    }

    login = async(data: LoginDTO )=> {
        // find the user by email input
        const user = await findUserByEmail(data.email);
        if(!user) {
            throw IncorrectCredentials
        }
        // compare passwords
        const match = await comparePassword(data.password,user.passwordHash)
        // if passwords doesnt match throw err
        if(!match) {
            throw IncorrectCredentials
        }
        // generate tokens
        const payload = {userId: user.id, role: user.systemRole, email: user.email};
        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);
        // return the data
        return {
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                systemRole: user.systemRole,
                createdAt: user.createdAt,
            }

        }
    }

    forgetPassword = async(data: ForgetPasswordDTO )=> {
        // check if user exists
        const user = await findUserByEmail(data.email);
        if(!user) {
            return
        }
        // generate an otp
        const otp =  generateOTP();
        // hash the otp
        const hashedOtp = hashOTP(otp);
        // insert the otp
        await createPasswordReset({
                userId: user.id,
                otpHash: hashedOtp,
                expiresAt: new Date(Date.now() + (10*60*1000)),
                createdAt: new Date(),
            }
        )
        // TODO: send email
        console.log(`mocked email sent ${otp}`)
    }

    resetPassword =  async(data: ResetPasswordDTO ) => {
        // find user
        const user = await findUserByEmail(data.email);
        if (!user) {
            throw InvalidOTPError
        }
        // find reset password
        const reset = await findLatestPasswordResetByUserId(user.id);
        console.log(reset)
        if(!reset) {
            throw InvalidOTPError
        }
        // verify otp and expiry date
        const inputOTPHash = hashOTP(data.otp)
        console.log(inputOTPHash);
        console.log(reset.otpHash);

        console.log(reset.isExpired());
        if(inputOTPHash != reset.otpHash || reset.isExpired() ) {
            throw InvalidOTPError
        }
        // update user password
        const hashedPassword = await hashPassword(data.newPassword);
        await updateUserPassword(user.id, hashedPassword);
        // update reset password
        await updatePasswordResetConsumedAt(reset.id)
    }
}

export const authService = new AuthService();