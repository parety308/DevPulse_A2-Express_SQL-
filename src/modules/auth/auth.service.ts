import { config } from "../../config";
import { pool } from "../../db"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const SignUpUserIntoDB = async (payload: any) => {
    const { name, email, password, role } = payload;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(`
        INSERT INTO users (name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *`, [name, email, hashedPassword, role]);
    return result;
};

const loginUserIntoDB = async (payload: { email: string; password: string; }) => {
    const { email, password } = payload;
    const result = await pool.query(`
        SELECT * FROM users WHERE email=$1 `, [email]);
    if (result.rows.length === 0) { throw new Error("Invalid email or password"); }
    const userData = result.rows[0];
    const isMatched = await bcrypt.compare(password, userData.password);
    if (!isMatched) {
        throw new Error("Invalid email or password");
    }
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