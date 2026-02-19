import {NextFunction, Request, Response} from "express";
import {validateBody} from "../../../common/validation/validate";
import {RegisterDTO, LoginDTO, ForgetPasswordDTO, ResetPasswordDTO} from "../dto/auth.dto";
import {AuthService, authService} from "../service/auth.service";

export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

    register = async(req: Request, res: Response, next: NextFunction) => {
        try{
            // 1. validate req.body
            const data = await validateBody(RegisterDTO, req.body);
            // 2. call service
            const result = await this.authService.register(data);
            // 3. respond
            res.cookie("access_token", result.accessToken,{
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60*60*1000
            })
            res.cookie("refresh_token", result.refreshToken,{
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 7*24*60*60*1000,
                path: '/api/auth/refresh'
            })
            res.status(201).json(result);
        } catch(err) {
            next(err);
        }
    }

    login = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(LoginDTO, req.body);
            const result = await this.authService.login(data);
            res.cookie("access_token", result.accessToken,{
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60*60*1000
            })
            res.cookie("refresh_token", result.refreshToken,{
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 7*24*60*60*1000,
                path: '/api/auth/refresh'
            })
            res.status(200).json(result)
        }
        catch (err) {
            next(err);
        }
    }
    forgetPassword = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(ForgetPasswordDTO, req.body);
            await this.authService.forgetPassword(data);
            res.status(200).json({
                "message": "Email Sent with OTP",
            })
        }
        catch(err) {
            next(err);
        }
    }

    resetPassword = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(ResetPasswordDTO, req.body);
            await this.authService.resetPassword(data);
            res.status(200).json({
                "message": "Password reset successfully, please login again",
            })
        }
        catch(err) {
            next(err);
        }
    }

    // refresh token endpoint
}

export const authController = new AuthController(authService);