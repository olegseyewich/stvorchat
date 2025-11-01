import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { hashPassword, comparePassword } from "../utils/password";
import { createHttpError } from "../middlewares/errorHandler";
import { signJwt } from "../utils/jwt";
import { toPublicUser } from "../services/userService";
import type { Prisma } from "../generated/client/client";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(50),
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, displayName } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw createHttpError(409, "Email already registered");
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
      },
    });

    const token = signJwt({ userId: user.id });
    res.status(201).json({ user: toPublicUser(user), token });
  } catch (error) {
    next(error);
  }
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw createHttpError(401, "Invalid credentials");
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw createHttpError(401, "Invalid credentials");
    }

    const token = signJwt({ userId: user.id });
    res.json({ user: toPublicUser(user), token });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    res.json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
};

const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  statusMessage: z.string().max(120).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const payload = updateProfileSchema.parse(req.body);

    const data: Prisma.UserUpdateInput = {};
    if (payload.displayName !== undefined) {
      data.displayName = payload.displayName;
    }
    if (payload.statusMessage !== undefined) {
      data.statusMessage = payload.statusMessage ?? null;
    }
    if (payload.avatarUrl !== undefined) {
      data.avatarUrl = payload.avatarUrl ?? null;
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
    });

    res.json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
};

