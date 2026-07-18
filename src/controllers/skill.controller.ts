import { Response } from "express";
import SkillListing from "../models/SkillListing";
import { AuthRequest } from "../middleware/auth.middleware";

// GET /api/skills — list with search, filter, sort, pagination
export async function getSkills(req: AuthRequest, res: Response) {
  try {
    const {
      search, category, level, mode,
      minPrice, maxPrice,
      sort = "newest",
      page = "1", limit = "12",
    } = req.query;

    const filter: any = {};
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (mode) filter.mode = mode;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search as string };
    }

    const sortMap: Record<string, any> = {
      newest: { createdAt: -1 },
      rating: { ratingAvg: -1 },
      price_low: { price: 1 },
      price_high: { price: -1 },
    };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));

    const [items, total] = await Promise.all([
      SkillListing.find(filter)
        .populate("teacher", "name avatar")
        .sort(sortMap[sort as string] || sortMap.newest)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      SkillListing.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch skills", error: (err as Error).message });
  }
}

// GET /api/skills/:id — details page
export async function getSkillById(req: AuthRequest, res: Response) {
  try {
    const skill = await SkillListing.findById(req.params.id).populate("teacher", "name avatar email");
    if (!skill) return res.status(404).json({ message: "Listing not found" });

    const related = await SkillListing.find({
      category: skill.category,
      _id: { $ne: skill._id },
    }).limit(4);

    res.json({ skill, related });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch listing", error: (err as Error).message });
  }
}

// POST /api/skills — protected, create
export async function createSkill(req: AuthRequest, res: Response) {
  try {
    const { title, shortDescription, fullDescription, category, level, mode, price, creditCost, imageUrl } = req.body;

    if (!title || !shortDescription || !fullDescription || !category || !level || !mode) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const skill = await SkillListing.create({
      teacher: req.userId,
      title, shortDescription, fullDescription, category, level, mode,
      price: price || 0,
      creditCost: creditCost || 1,
      imageUrl: imageUrl || "",
    });

    res.status(201).json(skill);
  } catch (err) {
    res.status(500).json({ message: "Failed to create listing", error: (err as Error).message });
  }
}

// GET /api/skills/mine — protected, for Manage page
export async function getMySkills(req: AuthRequest, res: Response) {
  try {
    const skills = await SkillListing.find({ teacher: req.userId }).sort({ createdAt: -1 });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your listings", error: (err as Error).message });
  }
}

// DELETE /api/skills/:id — protected, owner only
export async function deleteSkill(req: AuthRequest, res: Response) {
  try {
    const skill = await SkillListing.findById(req.params.id);
    if (!skill) return res.status(404).json({ message: "Listing not found" });
    if (skill.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized to delete this listing" });
    }
    await skill.deleteOne();
    res.json({ message: "Listing deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete listing", error: (err as Error).message });
  }
}