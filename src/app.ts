import express, { type Application, type Request, type Response } from "express";
import cors from "cors"
import { userRouter } from "./modules/auth/auth.route";
import { issuRouter } from "./modules/issue/issu.route";
const app: Application = express();

// Enable URL-encoded form data parsing
app.use(
    cors({
        origin: [
            "http://localhost:5000",
            "https://dev-pulse-sigma-one.vercel.app",
        ],
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', userRouter);
app.use('/api/issues', issuRouter);
try {
    app.get('/', (req: Request, res: Response) => {
        res.status(200).json({
            message: "Express and SQL Server Running ",
            author: "MD Parvez Hasan"
        })
    });
} catch (error) {
    console.log(error);
}

export default app;

// Start the server
