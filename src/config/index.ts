import dotenv from "dotenv";
dotenv.config();

export const config = {
    port: process.env.PORT,
    connectingString: process.env.CONNECTING_STRING,
    accessTokenSecret:process.env.AccessTokeSecret_JWT
}