import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken"
import { config } from "../config";
import sendResponse from "../utility/sendResponse";
import { pool } from "../db";
import type { TRoles } from "../types";

const auth = (...roles: TRoles[]) => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const token = req.headers.authorization;

            if (!token) {
                return sendResponse(res, {
                    statusCode: 401,
                    success: false,
                    message: "Unauthorized Access",
                });
            }

            const decoded = jwt.verify(
                token,
                config.accessTokenSecret as string
            ) as JwtPayload;

            const userData = await pool.query(
                `SELECT * FROM users WHERE email=$1`,
                [decoded.email]
            );

            if (userData.rows.length === 0) {
                return sendResponse(res, {
                    statusCode: 404,
                    success: false,
                    message: "User not found!",
                });
            }

            const user = userData.rows[0];

            if (roles.length && !roles.includes(user.role)) {
                return sendResponse(res, {
                    statusCode: 403,
                    success: false,
                    message: "Forbidden Access!",
                });
            }

            req.user = decoded;
            
                next();
        } catch (error) {
            return sendResponse(res, {
                statusCode: 401,
                success: false,
                message: "Invalid or expired token",
            });
        }
    };
};

export default auth;