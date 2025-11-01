import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (socket) {
    socket.auth = { token };
    if (socket.disconnected) {
      socket.connect();
    }
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("[Socket] Connected", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("[Socket] Disconnected");
  });

  socket.on("session:ready", (data) => {
    console.log("[Socket] Session ready", data);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

