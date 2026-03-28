import {db} from "../../../common/knex/knex";
import {findBranchIdsByMemberId} from "../../rbac/repository/member-branch.repo";
import {activateMemberByUserId, findRestaurantMemberWithRole} from "../../rbac/repository/restaurant_member.repo";
import {MemberService, memberService} from "../../rbac/service/member.service";
import {RestaurantService, restaurantService} from "../../restaurant/service/restaurant.service";
import {SystemRole} from "../../user/enums";
import {UserService, userService} from "../../user/service/user.service";
import {findUserByEmail, updateUserPassword} from "../../user/repository/users.repo";
import {RegisterDTO, LoginDTO, ForgetPasswordDTO, ResetPasswordDTO} from "../dto/auth.dto";
import {
    CannotSignupAsSystemAdmin,
    IncorrectCredentials,
    InvalidOTPError,
    RestaurantDataRequiredError
} from "../errors";
import {
    createPasswordReset,
    findLatestPasswordResetByUserId,
    updatePasswordResetConsumedAt
} from "../repository/password-reset.repo";
import {
    hashPassword,
    createAccessToken,
    createRefreshToken,
    comparePassword,
    generateOTP,
    hashOTP,
    verifyRefreshToken
} from "../utils";

export class AuthService {
    constructor(
        private readonly restaurantService: RestaurantService,
        private readonly userService: UserService,
        private readonly memberService: MemberService,
    ) {}

    register = async(data: RegisterDTO )=> {
        if (data.role == SystemRole.SYSTEM_ADMIN) {
            throw CannotSignupAsSystemAdmin
        }

        const trx = await db.transaction();
        let user
        let restaurant
        let restaurantMemberInfo: {restaurantId?: number, restaurantRole?: string, branchIds?: number[]} = {};
        try {
            user = await this.userService.create({
                email: data.email,
                phone: data.phone,
                name: data.name,
                password: data.password,
                systemRole: data.role,
            }, trx)

            // check if the type of user is restaurant, then call restaurant service to create a new restaurant
            if (data.role == SystemRole.RESTAURANT_USER) {
                if (data.restaurant == undefined) {
                    throw RestaurantDataRequiredError;
                }
                restaurant = await this.restaurantService.create(user.id, data.restaurant, trx)
                // insert the owner member via member service
                await this.memberService.createOwnerMember(restaurant.id, user.id, trx);
                restaurantMemberInfo = {
                    restaurantId: restaurant.id,
                    restaurantRole: 'owner',
                    branchIds: [],
                };
            }

            await trx.commit();
        } catch (error) {
            await trx.rollback();
            throw error;
        }

        // create access token , refresh token
        const payload = {userId: user.id, role: data.role, email: user.email, ...restaurantMemberInfo};
        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);

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
            },
            restaurant
        }
    }

    login = async(data: LoginDTO )=> {
        const user = await findUserByEmail(data.email);
        if(!user) {
            throw IncorrectCredentials
        }
        const match = await comparePassword(data.password,user.passwordHash)
        if(!match) {
            throw IncorrectCredentials
        }

        let restaurantMemberInfo = null
        if(user.systemRole == SystemRole.RESTAURANT_USER) {
            const memberData =  await findRestaurantMemberWithRole(user.id);
            const branchIds = await findBranchIdsByMemberId(memberData.member.id);
            if(memberData)  {
                restaurantMemberInfo = {
                    restaurantId: memberData.member.restaurantId,
                    restaurantRole: memberData.roleName,
                    branchIds
                }
            }
        }
        const payload = {userId: user.id, role: user.systemRole, email: user.email, ...restaurantMemberInfo};
        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);
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
        const user = await findUserByEmail(data.email);
        if(!user) {
            return
        }
        const otp =  generateOTP();
        const hashedOtp = hashOTP(otp);
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
        const user = await findUserByEmail(data.email);
        if (!user) {
            throw InvalidOTPError
        }
        const reset = await findLatestPasswordResetByUserId(user.id);
        if(!reset) {
            throw InvalidOTPError
        }
        const inputOTPHash = hashOTP(data.otp)

        if(inputOTPHash != reset.otpHash || reset.isExpired() ) {
            throw InvalidOTPError
        }
        const hashedPassword = await hashPassword(data.newPassword);
        await updateUserPassword(user.id, hashedPassword);
        await updatePasswordResetConsumedAt(reset.id)

        return user;
    }

    refresh = async(refreshToken: string) => {
        if (!refreshToken) {
            throw IncorrectCredentials;
        }
        const payload = verifyRefreshToken(refreshToken);
        const accessToken = createAccessToken({userId: payload.userId, role: payload.role, email: payload.email});
        return {accessToken};
    }

    acceptInvite = async(data: ResetPasswordDTO )=> {
        const user = await this.resetPassword(data)
        // activate member
        await activateMemberByUserId(user.id)
    }
}

export const authService = new AuthService(restaurantService, userService, memberService);
