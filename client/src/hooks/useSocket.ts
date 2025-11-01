import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { getSocket, initSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";

export const useSocket = () => {
  const token = useAuthStore((state) => state.token);
  const [socket, setSocket] = useState<Socket | null>(() => getSocket() ?? null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return;
    }

    const instance = initSocket(token);
    setSocket(instance);

    return () => {
      if (instance && instance.disconnected) {
        instance.close();
      }
    };
  }, [token]);

  return socket;
};

