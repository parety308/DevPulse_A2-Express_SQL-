import { Router, type Request, type Response } from "express";
import { userController } from "./auth.controller";

const router = Router();
router.post("/signup", userController.SignUpUser);
router.post("/login", userController.loginUser);
export const userRouter = router;