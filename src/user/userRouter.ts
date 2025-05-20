import express, { RequestHandler } from "express";
import { createUser, loginUser } from "./userController";

const userRouter = express.Router();

userRouter.post('/register', createUser as RequestHandler);
userRouter.post('/login', loginUser);

export default userRouter;