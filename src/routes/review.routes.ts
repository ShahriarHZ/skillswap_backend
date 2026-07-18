import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { createReview, getReviewsForSkill } from "../controllers/review.controller";

const router = Router();

router.post("/", requireAuth, createReview);
router.get("/skill/:skillId", getReviewsForSkill);

export default router;