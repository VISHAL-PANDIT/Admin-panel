import { Request, Response } from "express";
import { HttpError } from "http-errors";
import { config } from "../config/config";

const globalErrorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  
) => {
  const statusCode = err.status || 500;

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    errorStack: config.env === "development" ? err.stack ?? new Error().stack : ""
  });
};

export default globalErrorHandler;
