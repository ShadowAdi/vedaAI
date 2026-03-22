import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { logger } from "../config/logger.js";

export const CustomErrorHandler = (
  err: AppError,
  req: Request,
  response: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  logger.error(
    `Failed to get the error the status code is ${err.status} and the message is ${err.message}`
  );
  if (!err.isOperational) {
    logger.error("UNHANDLED ERROR ", err);
    console.error("UNHANDLED ERROR ", err);
  }

  response.status(err.statusCode).json({
    success: false,
    status: err.statusCode,
    message: err.message,
  });
};