import type { Request, Response } from "express"
import { userService } from "./auth.service";

const SignUpUser = async (req: Request, res: Response) => {
    const result = await userService.SignUpUserIntoDB(req.body);
    const user = result.rows[0];
    delete user.password;
    res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: user
    })
};

const loginUser = async (req: Request, res: Response) => {
    const result = await userService.loginUserIntoDB(req.body);
    res.status(200).json({
        success: true,
        message: "User login successfully",
        data: {
            token: result.accessToken,
            user: result.userData
        }
    })
}
export const userController = { SignUpUser, loginUser };