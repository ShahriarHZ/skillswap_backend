import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { chat, getChatHistory } from "../controllers/ai.controller";

const router = Router();

router.post("/chat", requireAuth, chat);
router.get("/chat/history", requireAuth, getChatHistory);

export default router;