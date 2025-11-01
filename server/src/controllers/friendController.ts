import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { createHttpError } from "../middlewares/errorHandler";
import { toPublicUser } from "../services/userService";
import type { Prisma } from "../generated/client/client";
import type { Server } from "socket.io";

type FriendRequestWithUsers = Prisma.FriendRequestGetPayload<{ include: { sender: true; receiver: true } }>;
type FriendshipWithUsers = Prisma.FriendshipGetPayload<{ include: { userA: true; userB: true } }>;

const requestSchema = z.object({
  receiverId: z.string().cuid(),
});

const normalizePair = (userId: string, otherId: string): [string, string] => {
  return [userId, otherId].sort((a, b) => (a > b ? 1 : -1)) as [string, string];
};

export const sendFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const { receiverId } = requestSchema.parse(req.body);
    if (receiverId === req.userId) {
      throw createHttpError(400, "Cannot send request to yourself");
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      throw createHttpError(404, "User not found");
    }

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: req.userId, userBId: receiverId },
          { userAId: receiverId, userBId: req.userId },
        ],
      },
    });

    if (existingFriendship) {
      throw createHttpError(409, "Already friends");
    }

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: req.userId, receiverId },
          { senderId: receiverId, receiverId: req.userId },
        ],
        status: "PENDING",
      },
    });

    if (existingRequest) {
      throw createHttpError(409, "Friend request already pending");
    }

    const request = await prisma.friendRequest.create({
      data: {
        senderId: req.userId,
        receiverId,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    const io = req.app.get("io") as Server | undefined;
    if (io) {
      console.log(`[FriendRequest] Sending refresh to receiver ${receiverId} and sender ${req.userId}`);
      
      // Проверяем, есть ли подключения в комнатах
      const socketsInReceiverRoom = await io.in(`user:${receiverId}`).fetchSockets();
      const socketsInSenderRoom = await io.in(`user:${req.userId}`).fetchSockets();
      
      console.log(`[FriendRequest] Receiver room has ${socketsInReceiverRoom.length} sockets`);
      console.log(`[FriendRequest] Sender room has ${socketsInSenderRoom.length} sockets`);
      
      if (socketsInReceiverRoom.length > 0) {
        io.to(`user:${receiverId}`).emit("friends:refresh");
        console.log(`[FriendRequest] Event sent to receiver ${receiverId}`);
      } else {
        console.warn(`[FriendRequest] Receiver ${receiverId} is not connected`);
      }
      
      if (socketsInSenderRoom.length > 0) {
        io.to(`user:${req.userId}`).emit("friends:refresh");
        console.log(`[FriendRequest] Event sent to sender ${req.userId}`);
      } else {
        console.warn(`[FriendRequest] Sender ${req.userId} is not connected`);
      }
    } else {
      console.warn("[FriendRequest] Socket.IO instance not found");
    }

    res.status(201).json({
      request: {
        id: request.id,
        status: request.status,
        createdAt: request.createdAt,
        sender: toPublicUser(request.sender),
        receiver: toPublicUser(request.receiver),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listFriendRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const requests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { receiverId: req.userId },
          { senderId: req.userId },
        ],
      },
      include: {
        sender: true,
        receiver: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      requests: requests.map((request: FriendRequestWithUsers) => ({
        id: request.id,
        status: request.status,
        createdAt: request.createdAt,
        respondedAt: request.respondedAt,
        sender: toPublicUser(request.sender),
        receiver: toPublicUser(request.receiver),
      })),
    });
  } catch (error) {
    next(error);
  }
};

const respondParamsSchema = z.object({
  requestId: z.string().cuid(),
});

export const acceptFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const { requestId } = respondParamsSchema.parse(req.params);

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.receiverId !== req.userId) {
      throw createHttpError(404, "Friend request not found");
    }

    if (request.status !== "PENDING") {
      throw createHttpError(400, "Friend request already processed");
    }

    const [userAId, userBId] = normalizePair(req.userId, request.senderId);

    const friendship = await prisma.friendship.create({
      data: {
        userAId,
        userBId,
      },
    });

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: "ACCEPTED",
        respondedAt: new Date(),
      },
    });

    const io = req.app.get("io") as Server | undefined;
    if (io) {
      io.to(`user:${req.userId}`).emit("friends:refresh");
      io.to(`user:${request.senderId}`).emit("friends:refresh");
    }

    res.json({ friendship });
  } catch (error) {
    next(error);
  }
};

export const declineFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const { requestId } = respondParamsSchema.parse(req.params);

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.receiverId !== req.userId) {
      throw createHttpError(404, "Friend request not found");
    }

    if (request.status !== "PENDING") {
      throw createHttpError(400, "Friend request already processed");
    }

    await prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: "DECLINED",
        respondedAt: new Date(),
      },
    });

    const io = req.app.get("io") as Server | undefined;
    if (io) {
      io.to(`user:${req.userId}`).emit("friends:refresh");
      io.to(`user:${request.senderId}`).emit("friends:refresh");
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const listFriends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userAId: req.userId },
          { userBId: req.userId },
        ],
      },
      include: {
        userA: true,
        userB: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const friends = friendships.map((friendship: FriendshipWithUsers) => {
      const friend = friendship.userAId === req.userId ? friendship.userB : friendship.userA;
      return toPublicUser(friend);
    });

    res.json({ friends });
  } catch (error) {
    next(error);
  }
};

