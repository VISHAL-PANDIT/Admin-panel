import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { verify, TokenExpiredError } from "jsonwebtoken";
import { config } from "../config/config";

export interface AuthRequest extends Request {
    userId: string;
}

const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization");
    console.log("Received Authorization header:", token);
    
    if (!token) {
        return next(createHttpError(401, "Authorization token is required"));
    }

    try {
        // Check if token starts with "Bearer "
        if (!token.startsWith("Bearer ")) {
            console.log("Invalid token format - missing 'Bearer ' prefix");
            return next(createHttpError(401, "Invalid token format. Must start with 'Bearer '"));
        }

        const parsedToken = token.split(" ")[1];
        console.log("Parsed token:", parsedToken);

        const decoded = verify(parsedToken, config.jwtSecret as string);
        console.log("Decoded token:", decoded);
        
        // Check if token has required fields
        if (!decoded.sub) {
            console.log("Token missing 'sub' field");
            return next(createHttpError(401, "Invalid token - missing user ID"));
        }

        const _req = req as AuthRequest;
        _req.userId = decoded.sub as string;
        console.log("Set userId in request:", _req.userId);
        
        next();
    } catch (error) {
        console.log("Token verification error:", error);
        if (error instanceof TokenExpiredError) {
            return next(createHttpError(401, "Token has expired"));
        }
        return next(createHttpError(401, "Invalid token"));
    }
};

export default authenticate;
