import { NextFunction, Request, Response } from "express";
import { createHttpError } from "./errorHandler";
import { verifyJwt } from "../utils/jwt";

const getTokenFromRequest = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring("Bearer ".length);
  }

  if (req.cookies?.token) {
    return req.cookies.token as string;
  }

  return null;
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(createHttpError(401, "Authentication required"));
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return next(createHttpError(401, "Invalid token"));
  }

  req.userId = payload.userId;
  return next();
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return next();
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return next();
  }

  req.userId = payload.userId;
  return next();
};

