import express, { RequestHandler } from "express";
import { createUser } from "./userController";

const userRouter = express.Router();

userRouter.post('/register', createUser as RequestHandler);
// userRouter.post('/login', loginUser);

export default userRouter;