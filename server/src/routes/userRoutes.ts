import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware";
import { getUserProfile, searchUsers } from "../controllers/userController";

const router = Router();

router.use(requireAuth);

router.get("/search", searchUsers);
router.get("/:userId", getUserProfile);

export default router;

