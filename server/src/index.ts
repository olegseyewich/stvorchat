import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes";
import friendRoutes from "./routes/friendRoutes";
import roomRoutes from "./routes/roomRoutes";
import channelRoutes from "./routes/channelRoutes";
import userRoutes from "./routes/userRoutes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { registerSocketHandlers } from "./ws/socket";

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",");

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/friends", friendRoutes);
app.use("/rooms", roomRoutes);
app.use("/channels", channelRoutes);
app.use("/users", userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set("io", io);

registerSocketHandlers(io);

const PORT = Number(process.env.PORT || 4000);

server.listen(PORT, () => {
  console.log(`Stvor server listening on port ${PORT}`);
});

