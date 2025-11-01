import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Message, PaginatedMessages } from "@/types/api";
import { useSocket } from "./useSocket";

const fetchMessages = async (channelId: string) => {
  const { data } = await api.get<PaginatedMessages>(`/channels/${channelId}/messages`, {
    params: { limit: 50 },
  });
  return data;
};

export const useMessages = (channelId: string | null) => {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const query = useQuery({
    queryKey: ["messages", channelId],
    queryFn: () => fetchMessages(channelId!),
    enabled: Boolean(channelId),
    gcTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!socket || !channelId) return;

    const handleNewMessage = (message: Message) => {
      if (message.channelId !== channelId) return;

      queryClient.setQueryData<PaginatedMessages | undefined>(["messages", channelId], (current) => {
        if (!current) {
          return { messages: [message], nextCursor: null };
        }
        return {
          ...current,
          messages: [message, ...current.messages],
        };
      });
    };

    socket.emit("channel:join", { channelId });
    socket.on("message:new", handleNewMessage);

    return () => {
      socket.emit("channel:leave", { channelId });
      socket.off("message:new", handleNewMessage);
    };
  }, [channelId, queryClient, socket]);

  const sendMessage = async (content: string) => {
    if (!channelId || !socket) return;
    if (!content.trim()) return;

    socket.emit("message:send", { channelId, content: content.trim() });
  };

  return {
    messages: query.data?.messages ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    sendMessage,
  };
};

