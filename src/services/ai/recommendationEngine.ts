import { groq, MODEL } from "./client";
import SkillListing from "../../models/SkillListing";
import Booking from "../../models/Booking";

interface RecommendInput {
  userId: string;
  query: string;
}

export async function getRecommendations({ userId, query }: RecommendInput) {
  const pastBookings = await Booking.find({ learner: userId }).populate("listing");
  const pastCategories = [...new Set(pastBookings.map((b: any) => b.listing?.category).filter(Boolean))];

  const candidates = await SkillListing.find(
    query ? { $text: { $search: query } } : {}
  )
    .limit(20)
    .populate("teacher", "name");

  const pool = candidates.length > 0
    ? candidates
    : await SkillListing.find({}).sort({ ratingAvg: -1 }).limit(20).populate("teacher", "name");

  if (pool.length === 0) {
    return { recommendations: [] };
  }

  const candidateSummary = pool.map((s) => ({
    id: s._id.toString(),
    title: s.title,
    category: s.category,
    level: s.level,
    mode: s.mode,
    rating: s.ratingAvg,
  }));

  const completion = await groq.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'You are SkillSwap\'s recommendation engine. Given a learner\'s goal, past categories they\'ve booked, and a list of candidate skill listings, pick the best 3-5 matches and explain briefly why each fits. Respond ONLY with valid JSON, no markdown fences, no preamble. Shape: { "recommendations": [{ "id": string, "reason": string }] }',
      },
      {
        role: "user",
        content: `Learner goal: "${query || "general recommendations"}"
Past categories booked: ${pastCategories.join(", ") || "none yet"}
Candidate listings: ${JSON.stringify(candidateSummary)}`,
      },
    ],
  });

  let parsed: { recommendations: { id: string; reason: string }[] };
  try {
    parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  } catch {
    parsed = { recommendations: candidateSummary.slice(0, 3).map((c) => ({ id: c.id, reason: "Matches your search." })) };
  }

  const recommendations = parsed.recommendations
    .map((r) => {
      const listing = pool.find((s) => s._id.toString() === r.id);
      return listing ? { listing, reason: r.reason } : null;
    })
    .filter(Boolean);

  return { recommendations };
}