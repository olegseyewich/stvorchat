import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { createHttpError } from "../middlewares/errorHandler";
import { toPublicUser } from "../services/userService";
import { isUserOnline } from "../services/presenceService";
import type { Prisma } from "../generated/client/client";

type UserModel = Prisma.UserGetPayload<{}>;

const searchSchema = z.object({
  q: z.string().min(1).max(50),
  limit: z.coerce.number().min(1).max(20).optional(),
});

export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const { q, limit } = searchSchema.parse(req.query);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
        NOT: { id: req.userId },
      },
      take: limit ?? 10,
      orderBy: { createdAt: "desc" },
    });

    res.json({
      users: users.map((user: UserModel) => ({
        ...toPublicUser(user),
        isOnline: isUserOnline(user.id),
      })),
    });
  } catch (error) {
    next(error);
  }
};

const paramsSchema = z.object({
  userId: z.string().cuid(),
});

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = paramsSchema.parse(req.params);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw createHttpError(404, "User not found");
    }

    res.json({
      user: {
        ...toPublicUser(user),
        isOnline: isUserOnline(user.id),
      },
    });
  } catch (error) {
    next(error);
  }
};

