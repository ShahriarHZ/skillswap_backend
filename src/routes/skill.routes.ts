import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  getSkills, getSkillById, createSkill, getMySkills, deleteSkill,
} from "../controllers/skill.controller";

const router = Router();

router.get("/mine", requireAuth, getMySkills);   // must come before /:id
router.get("/", getSkills);
router.get("/:id", getSkillById);
router.post("/", requireAuth, createSkill);
router.delete("/:id", requireAuth, deleteSkill);

export default router;