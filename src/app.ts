import express, { type Application, type Request, type Response } from "express";
import cors from "cors"
import { userRouter } from "./modules/auth/auth.route";
const app: Application = express();

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "http://localhost:5000"
}));
app.use(express.json());
app.use('/api/auth', userRouter)
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
