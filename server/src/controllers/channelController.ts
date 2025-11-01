import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { createHttpError } from "../middlewares/errorHandler";
import { toPublicUser } from "../services/userService";
import type { Prisma } from "../generated/client/client";

type ChannelMemberWithUser = Prisma.ChannelMemberGetPayload<{ include: { user: true } }>;
type MessageWithAuthor = Prisma.MessageGetPayload<{ include: { author: true } }>;

const directChannelSchema = z.object({
  targetUserId: z.string().cuid(),
});

const ensureDirectFriendship = async (userId: string, otherUserId: string) => {
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: userId, userBId: otherUserId },
        { userAId: otherUserId, userBId: userId },
      ],
    },
  });

  if (!friendship) {
    throw createHttpError(403, "This user is not in your friend list");
  }
};

export const upsertDirectChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const { targetUserId } = directChannelSchema.parse(req.body);
    if (targetUserId === req.userId) {
      throw createHttpError(400, "Cannot start a direct chat with yourself");
    }

    await ensureDirectFriendship(req.userId, targetUserId);

    const existing = await prisma.channel.findFirst({
      where: {
        type: "DIRECT",
        members: {
          some: { userId: req.userId },
        },
        AND: {
          members: {
            some: { userId: targetUserId },
          },
        },
      },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    if (existing) {
      res.json({
        channel: {
          id: existing.id,
          type: existing.type,
          createdAt: existing.createdAt,
        members: existing.members.map((member: ChannelMemberWithUser) => ({
            id: member.id,
            user: toPublicUser(member.user),
          })),
        },
      });
      return;
    }

    const channel = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdChannel = await tx.channel.create({
        data: {
          name: "Direct message",
          type: "DIRECT",
        },
      });

      await tx.channelMember.createMany({
        data: [
          { channelId: createdChannel.id, userId: req.userId! },
          { channelId: createdChannel.id, userId: targetUserId },
        ],
      });

      const members = await tx.channelMember.findMany({
        where: { channelId: createdChannel.id },
        include: { user: true },
      });

      return {
        ...createdChannel,
        members,
      };
    });

    res.status(201).json({
      channel: {
        id: channel.id,
        type: channel.type,
        createdAt: channel.createdAt,
        members: channel.members.map((member: ChannelMemberWithUser) => ({
          id: member.id,
          user: toPublicUser(member.user),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

const channelParamsSchema = z.object({
  channelId: z.string().cuid(),
});

const messagesQuerySchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export const listChannelMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const { channelId } = channelParamsSchema.parse(req.params);
    const { cursor, limit } = messagesQuerySchema.parse(req.query);

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { room: true },
    });

    if (!channel) {
      throw createHttpError(404, "Channel not found");
    }

    if (channel.roomId) {
      const membership = await prisma.roomMembership.findUnique({
        where: {
          userId_roomId: {
            userId: req.userId,
            roomId: channel.roomId,
          },
        },
      });

      if (!membership) {
        throw createHttpError(403, "You are not a member of this room");
      }
    } else {
      const membership = await prisma.channelMember.findFirst({
        where: {
          channelId,
          userId: req.userId,
        },
      });
      if (!membership) {
        throw createHttpError(403, "You are not a member of this channel");
      }
    }

    const take = limit ?? 50;
    const messageQuery: Prisma.MessageFindManyArgs = {
      where: { channelId },
      include: { author: true },
      orderBy: { createdAt: "desc" },
      take,
      skip: 0,
    };

    if (cursor) {
      messageQuery.cursor = { id: cursor };
      messageQuery.skip = 1;
    }

    const messages = (await prisma.message.findMany(messageQuery)) as MessageWithAuthor[];

    const hasMore = messages.length === take;
    const nextCursor = hasMore && messages.length > 0 ? messages[messages.length - 1]!.id : null;

    res.json({
      messages: messages.map((message: MessageWithAuthor) => ({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        author: toPublicUser(message.author),
      })),
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

const createMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const createMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createHttpError(401, "Unauthorized");
    }

    const { channelId } = channelParamsSchema.parse(req.params);
    const { content } = createMessageSchema.parse(req.body);

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw createHttpError(404, "Channel not found");
    }

    if (channel.roomId) {
      const membership = await prisma.roomMembership.findUnique({
        where: {
          userId_roomId: {
            userId: req.userId,
            roomId: channel.roomId,
          },
        },
      });
      if (!membership) {
        throw createHttpError(403, "You are not a member of this room");
      }
    } else {
      const membership = await prisma.channelMember.findFirst({
        where: { channelId, userId: req.userId },
      });
      if (!membership) {
        throw createHttpError(403, "You are not a member of this channel");
      }
    }

    const message = await prisma.message.create({
      data: {
        content,
        channelId,
        userId: req.userId,
      },
      include: {
        author: true,
      },
    });

    res.status(201).json({
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        author: toPublicUser(message.author),
      },
    });
  } catch (error) {
    next(error);
  }
};

