import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getPersonalRecommendations } from "../controllers/recommend.controller";

const router = Router();

router.get("/", requireAuth, getPersonalRecommendations);

export default router;