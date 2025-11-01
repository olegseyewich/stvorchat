import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { createHttpError } from "../middlewares/errorHandler";
import type { Prisma } from "../generated/client/client";
import type { Server } from "socket.io";
import { toPublicUser } from "../services/userService";

type MembershipWithRoom = Prisma.RoomMembershipGetPayload<{
  include: {
    room: {
      include: {
        channels: true;
        memberships: {
          include: { user: true };
        };
      };
    };
  };
}>;

const createRoomSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(180).optional(),
});

export const createRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const payload = createRoomSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const room = await tx.room.create({
        data: {
          name: payload.name,
          description: payload.description ?? null,
          ownerId: req.userId!,
        },
      });

      await tx.roomMembership.create({
        data: {
          userId: req.userId!,
          roomId: room.id,
          role: "OWNER",
        },
      });

      const channel = await tx.channel.create({
        data: {
          name: "general",
          type: "TEXT",
          roomId: room.id,
        },
      });

      return { room, channel };
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const listRooms = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const memberships = await prisma.roomMembership.findMany({
      where: { userId: req.userId },
      include: {
        room: {
          include: {
            channels: {
              orderBy: { createdAt: "asc" },
            },
            memberships: {
              include: { user: true },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const rooms = memberships.map((membership: MembershipWithRoom) => ({
      id: membership.room.id,
      name: membership.room.name,
      description: membership.room.description,
      ownerId: membership.room.ownerId,
      createdAt: membership.room.createdAt,
      channels: membership.room.channels,
      members: membership.room.memberships.map((member) => toPublicUser(member.user)),
      role: membership.role,
    }));

    res.json({ rooms });
  } catch (error) {
    next(error);
  }
};

const roomIdParamsSchema = z.object({
  roomId: z.string().cuid(),
});

export const listRoomChannels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }
    const { roomId } = roomIdParamsSchema.parse(req.params);

    const membership = await prisma.roomMembership.findUnique({
      where: {
        userId_roomId: {
          userId: req.userId,
          roomId,
        },
      },
    });

    if (!membership) {
      throw createHttpError(403, "You are not a member of this room");
    }

    const channels = await prisma.channel.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
    });

    res.json({ channels });
  } catch (error) {
    next(error);
  }
};

const createChannelSchema = z.object({
  name: z.string().min(2).max(60),
});

const inviteSchema = z.object({
  userId: z.string().cuid(),
});

export const createRoomChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const { roomId } = roomIdParamsSchema.parse(req.params);
    const { name } = createChannelSchema.parse(req.body);

    const membership = await prisma.roomMembership.findUnique({
      where: {
        userId_roomId: {
          userId: req.userId,
          roomId,
        },
      },
    });

    if (!membership) {
      throw createHttpError(403, "You are not a member of this room");
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        roomId,
        type: "TEXT",
      },
    });

    res.status(201).json({ channel });
  } catch (error) {
    next(error);
  }
};

export const inviteToRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const { roomId } = roomIdParamsSchema.parse(req.params);
    const { userId } = inviteSchema.parse(req.body);

    if (userId === req.userId) {
      throw createHttpError(400, "Cannot invite yourself");
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        memberships: true,
      },
    });

    if (!room) {
      throw createHttpError(404, "Room not found");
    }

    if (room.ownerId !== req.userId) {
      throw createHttpError(403, "Only the owner can invite members");
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      throw createHttpError(404, "User not found");
    }

    const existingMembership = await prisma.roomMembership.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    if (existingMembership) {
      throw createHttpError(409, "User is already a member of this room");
    }

    const isFriend = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: req.userId, userBId: userId },
          { userAId: userId, userBId: req.userId },
        ],
      },
    });

    if (!isFriend) {
      throw createHttpError(403, "You can invite only your friends");
    }

    const membership = await prisma.roomMembership.create({
      data: {
        userId,
        roomId,
        role: "MEMBER",
      },
      include: {
        user: true,
      },
    });

    const io = req.app.get("io") as Server | undefined;
    if (io) {
      io.to(`user:${userId}`).emit("rooms:refresh", { roomId });
    }

    res.status(201).json({
      membership: {
        id: membership.id,
        role: membership.role,
        createdAt: membership.createdAt,
        user: toPublicUser(membership.user),
      },
    });
  } catch (error) {
    next(error);
  }
};

