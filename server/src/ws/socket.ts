import { Server, Socket } from "socket.io";
import { z } from "zod";
import { verifyJwt } from "../utils/jwt";
import { prisma } from "../utils/prisma";
import {
  getOnlineUsers,
  setUserOffline,
  setUserOnline,
} from "../services/presenceService";

type AuthedSocket = Socket & {
  data: {
    userId?: string;
  };
};

const channelJoinSchema = z.object({
  channelId: z.string().cuid(),
});

const messageSendSchema = z.object({
  channelId: z.string().cuid(),
  content: z.string().min(1).max(2000),
});

const typingSchema = z.object({
  channelId: z.string().cuid(),
  isTyping: z.boolean(),
});

const extractToken = (socket: AuthedSocket) => {
  const auth = socket.handshake.auth?.token as string | undefined;
  if (auth) return auth;

  const header = socket.handshake.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.substring("Bearer ".length);
  }

  const tokenFromQuery = socket.handshake.query?.token;
  if (typeof tokenFromQuery === "string") {
    return tokenFromQuery;
  }

  return null;
};

const ensureChannelAccess = async (userId: string, channelId: string) => {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  });

  if (!channel) {
    throw new Error("CHANNEL_NOT_FOUND");
  }

  if (channel.roomId) {
    const membership = await prisma.roomMembership.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: channel.roomId,
        },
      },
    });

    if (!membership) {
      throw new Error("FORBIDDEN");
    }
  } else {
    const membership = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("FORBIDDEN");
    }
  }

  return channel;
};

const channelRoom = (channelId: string) => `channel:${channelId}`;

const toMessagePayload = (message: {
  id: string;
  content: string;
  channelId: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    statusMessage: string | null;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
}) => ({
  id: message.id,
  content: message.content,
  channelId: message.channelId,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  author: {
    id: message.author.id,
    displayName: message.author.displayName,
    avatarUrl: message.author.avatarUrl,
    statusMessage: message.author.statusMessage,
    email: message.author.email,
    createdAt: message.author.createdAt,
    updatedAt: message.author.updatedAt,
  },
});

const broadcastPresence = (io: Server) => {
  io.emit("presence:list", { users: getOnlineUsers() });
};

export const registerSocketHandlers = (io: Server) => {
  io.use((socket: AuthedSocket, next) => {
    const token = extractToken(socket);
    if (!token) {
      next(new Error("UNAUTHORIZED"));
      return;
    }

    const payload = verifyJwt(token);
    if (!payload) {
      next(new Error("UNAUTHORIZED"));
      return;
    }

    socket.data.userId = payload.userId;
    next();
  });

  io.on("connection", (socket: AuthedSocket) => {
    const userId = socket.data.userId!;
    setUserOnline(userId);
    socket.join(`user:${userId}`);
    socket.emit("session:ready", { userId });
    broadcastPresence(io);

    socket.on("channel:join", async (rawPayload) => {
      try {
        const payload = channelJoinSchema.parse(rawPayload);
        await ensureChannelAccess(userId, payload.channelId);
        socket.join(channelRoom(payload.channelId));
        socket.emit("channel:joined", { channelId: payload.channelId });
      } catch (error) {
        socket.emit("error", { type: "channel:join", message: (error as Error).message });
      }
    });

    socket.on("channel:leave", (rawPayload) => {
      const result = channelJoinSchema.safeParse(rawPayload);
      if (!result.success) {
        return;
      }
      socket.leave(channelRoom(result.data.channelId));
    });

    socket.on("message:send", async (rawPayload) => {
      try {
        const payload = messageSendSchema.parse(rawPayload);
        await ensureChannelAccess(userId, payload.channelId);

        const message = await prisma.message.create({
          data: {
            content: payload.content,
            channelId: payload.channelId,
            userId,
          },
          include: {
            author: true,
          },
        });

        const messagePayload = toMessagePayload(message);
        io.to(channelRoom(payload.channelId)).emit("message:new", messagePayload);
      } catch (error) {
        socket.emit("error", { type: "message:send", message: (error as Error).message });
      }
    });

    socket.on("typing", async (rawPayload) => {
      const result = typingSchema.safeParse(rawPayload);
      if (!result.success) {
        return;
      }

      try {
        await ensureChannelAccess(userId, result.data.channelId);
        socket.to(channelRoom(result.data.channelId)).emit("typing", {
          channelId: result.data.channelId,
          userId,
          isTyping: result.data.isTyping,
        });
      } catch (error) {
        socket.emit("error", { type: "typing", message: (error as Error).message });
      }
    });

    socket.on("presence:request", () => {
      socket.emit("presence:list", { users: getOnlineUsers() });
    });

    socket.on("disconnect", () => {
      setUserOffline(userId);
      broadcastPresence(io);
    });
  });
};

