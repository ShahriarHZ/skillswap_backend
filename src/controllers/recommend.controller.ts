import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { getRecommendations } from "../services/ai/recommendationEngine";

// GET /api/recommendations?category=...&mode=...&level=...
export async function getPersonalRecommendations(req: AuthRequest, res: Response) {
  try {
    const { category, mode, level } = req.query;

    // build a natural-language query out of the filters so the LLM
    // still reasons over them, while the filters remain visible/controllable in the UI
    const parts: string[] = [];
    if (category) parts.push(`category: ${category}`);
    if (mode) parts.push(`mode: ${mode}`);
    if (level) parts.push(`level: ${level}`);
    const query = parts.length > 0 ? parts.join(", ") : "";

    const result = await getRecommendations({
      userId: req.userId as string,
      query,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch recommendations", error: (err as Error).message });
  }
}