import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import {
  createMessage,
  listChannelMessages,
  upsertDirectChannel,
} from "../controllers/channelController";

const router = Router();

router.use(requireAuth);

router.post("/direct", upsertDirectChannel);
router.get("/:channelId/messages", listChannelMessages);
router.post("/:channelId/messages", createMessage);

export default router;


