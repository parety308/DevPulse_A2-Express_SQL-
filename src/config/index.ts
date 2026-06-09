import dotenv from "dotenv";
dotenv.config();
console.log(
  "CONNECTING_STRING exists:",
  !!process.env.CONNECTING_STRING
);

export const config = {
    port: process.env.PORT,
    connectingString: process.env.CONNECTING_STRING,
    accessTokenSecret:process.env.AccessTokeSecret_JWT
}