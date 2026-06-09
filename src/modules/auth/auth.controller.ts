import type { Request, Response } from "express"
import { userService } from "./auth.service";

const SignUpUser = async (req: Request, res: Response) => {
    try {
        const result = await userService.SignUpUserIntoDB(req.body);
        const user = result.rows[0];
        delete user.password;
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user
        })
    } catch (error: any) {
        if (error.code === '23505') {
            throw new Error("Email already exists");
        }
        throw error;
    }
};

const loginUser = async (req: Request, res: Response) => {
    try {
        const result = await userService.loginUserIntoDB(req.body);

        res.status(200).json({
            success: true,
            message: "User login successfully",
            data: result
        });

    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
export const userController = { SignUpUser, loginUser };