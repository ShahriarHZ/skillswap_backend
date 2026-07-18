import { Response } from "express";
import mongoose from "mongoose";
import Review from "../models/Review";
import Booking from "../models/Booking";
import SkillListing from "../models/SkillListing";
import { AuthRequest } from "../middleware/auth.middleware";

// POST /api/reviews — leave a review for a completed booking
export async function createReview(req: AuthRequest, res: Response) {
  const session = await mongoose.startSession();
  try {
    const { bookingId, rating, comment } = req.body;
    if (!bookingId || !rating || !comment) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    let review;
    await session.withTransaction(async () => {
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) throw new Error("NOT_FOUND");
      if (booking.learner.toString() !== req.userId) throw new Error("FORBIDDEN");
      if (booking.status !== "completed") throw new Error("NOT_COMPLETED");

      const existing = await Review.findOne({
        listing: booking.listing,
        author: req.userId,
      }).session(session);
      if (existing) throw new Error("ALREADY_REVIEWED");

      const [created] = await Review.create(
        [{ listing: booking.listing, author: req.userId, rating, comment }],
        { session }
      );
      review = created;

      // recalculate the listing's rating average
      const stats = await Review.aggregate([
        { $match: { listing: booking.listing } },
        { $group: { _id: "$listing", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]).session(session);

      if (stats[0]) {
        await SkillListing.findByIdAndUpdate(
          booking.listing,
          { ratingAvg: Math.round(stats[0].avg * 10) / 10, ratingCount: stats[0].count },
          { session }
        );
      }
    });

    res.status(201).json(review);
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return res.status(404).json({ message: "Booking not found" });
    if (err.message === "FORBIDDEN") return res.status(403).json({ message: "Not authorized" });
    if (err.message === "NOT_COMPLETED") return res.status(400).json({ message: "You can only review completed sessions" });
    if (err.message === "ALREADY_REVIEWED") return res.status(409).json({ message: "You've already reviewed this listing" });
    res.status(500).json({ message: "Failed to submit review", error: err.message });
  } finally {
    session.endSession();
  }
}

// GET /api/reviews/skill/:skillId — reviews for a listing's details page
export async function getReviewsForSkill(req: AuthRequest, res: Response) {
  try {
    const reviews = await Review.find({ listing: req.params.skillId })
      .populate("author", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews", error: (err as Error).message });
  }
}