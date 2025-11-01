import { useEffect } from "react";
import { usePresenceStore } from "@/store/presenceStore";
import { useSocket } from "./useSocket";

export const usePresence = () => {
  const socket = useSocket();
  const onlineUserIds = usePresenceStore((state) => state.onlineUserIds);
  const setOnlineUsers = usePresenceStore((state) => state.setOnlineUsers);

  useEffect(() => {
    if (!socket) return;

    const handlePresence = (payload: { users: string[] }) => {
      setOnlineUsers(payload.users);
    };

    socket.on("presence:list", handlePresence);
    socket.emit("presence:request");

    return () => {
      socket.off("presence:list", handlePresence);
    };
  }, [setOnlineUsers, socket]);

  const isOnline = (userId: string) => onlineUserIds.has(userId);

  return { isOnline, onlineUserIds };
};

