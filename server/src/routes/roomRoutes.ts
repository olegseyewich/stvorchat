import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import {
  createRoom,
  createRoomChannel,
  inviteToRoom,
  listRoomChannels,
  listRooms,
} from "../controllers/roomController";

const router = Router();

router.use(requireAuth);

router.get("/", listRooms);
router.post("/", createRoom);
router.get("/:roomId/channels", listRoomChannels);
router.post("/:roomId/channels", createRoomChannel);
router.post("/:roomId/invite", inviteToRoom);

export default router;

