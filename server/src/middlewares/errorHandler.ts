import { NextFunction, Request, Response } from "express";
import { HttpError, isHttpError } from "../utils/errors";

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
};

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  if (isHttpError(error)) {
    res.status(error.status).json({ message: error.message, details: error.details });
    return;
  }

  console.error("Unexpected error", error);
  res.status(500).json({ message: "Internal server error" });
};

export const createHttpError = (status: number, message: string, details?: unknown) => {
  return new HttpError(status, message, details);
};


