import { config } from "../../config";
import { pool } from "../../db"
import jwt from "jsonwebtoken"

const SignUpUserIntoDB = async (payload: any) => {
    const { name, email, password, role } = payload;
    // const hashPassword="";
    const result = await pool.query(`
        INSERT INTO users (name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *`, [name, email, password, role]);
    return result;
};

const loginUserIntoDB = async (payload: any) => {
    const { email, password } = payload;
    const result = await pool.query(`
        SELECT * FROM users WHERE email=$1 `, [email]);
    const userData = result.rows[0];
    const jwtPayload = {
        id: userData.id,
        name: userData.name,
        role: userData.role,
        email: userData.email
    };
    // console.log(jwtPayload);
    const accessToken = jwt.sign(jwtPayload, config.accessTokenSecret as string, { expiresIn: "1d" })
    // userData.accessToken = accessToken
    delete userData.password;
    return { userData, accessToken };

}

export const userService = { SignUpUserIntoDB, loginUserIntoDB };