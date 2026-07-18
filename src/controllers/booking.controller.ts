import { Response } from "express";
import mongoose from "mongoose";
import Booking from "../models/Booking";
import SkillListing from "../models/SkillListing";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";

// POST /api/bookings — create a booking
export async function createBooking(req: AuthRequest, res: Response) {
  const session = await mongoose.startSession();
  try {
    const { listingId, scheduledAt, paymentType } = req.body;
    if (!listingId || !scheduledAt || !paymentType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let booking;
    await session.withTransaction(async () => {
      const listing = await SkillListing.findById(listingId).session(session);
      if (!listing) throw new Error("NOT_FOUND");

      if (listing.teacher.toString() === req.userId) {
        throw new Error("SELF_BOOK");
      }

      if (paymentType === "credits") {
        const learner = await User.findById(req.userId).session(session);
        if (!learner || learner.credits < listing.creditCost) {
          throw new Error("INSUFFICIENT_CREDITS");
        }
        learner.credits -= listing.creditCost;
        await learner.save({ session });
      }

      const [created] = await Booking.create(
        [
          {
            listing: listing._id,
            learner: req.userId,
            teacher: listing.teacher,
            scheduledAt,
            paymentType,
            status: "pending",
          },
        ],
        { session }
      );
      booking = created;
    });

    res.status(201).json(booking);
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return res.status(404).json({ message: "Listing not found" });
    if (err.message === "SELF_BOOK") return res.status(400).json({ message: "You can't book your own listing" });
    if (err.message === "INSUFFICIENT_CREDITS") return res.status(400).json({ message: "Not enough credits for this session" });
    res.status(500).json({ message: "Failed to create booking", error: err.message });
  } finally {
    session.endSession();
  }
}

// GET /api/bookings/mine — bookings where I'm the learner
export async function getMyBookings(req: AuthRequest, res: Response) {
  try {
    const bookings = await Booking.find({ learner: req.userId })
      .populate("listing", "title imageUrl price creditCost")
      .populate("teacher", "name")
      .sort({ scheduledAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings", error: (err as Error).message });
  }
}

// GET /api/bookings/teaching — bookings where I'm the teacher
export async function getTeachingBookings(req: AuthRequest, res: Response) {
  try {
    const bookings = await Booking.find({ teacher: req.userId })
      .populate("listing", "title imageUrl")
      .populate("learner", "name")
      .sort({ scheduledAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings", error: (err as Error).message });
  }
}

// PATCH /api/bookings/:id/status — teacher confirms/completes/cancels
export async function updateBookingStatus(req: AuthRequest, res: Response) {
  const session = await mongoose.startSession();
  try {
    const { status } = req.body;
    if (!["confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    let updated;
    await session.withTransaction(async () => {
      const booking = await Booking.findById(req.params.id).session(session);
      if (!booking) throw new Error("NOT_FOUND");
      if (booking.teacher.toString() !== req.userId) throw new Error("FORBIDDEN");

      // teacher earns 1 credit when a session is marked completed
      if (status === "completed" && booking.status !== "completed") {
        await User.findByIdAndUpdate(booking.teacher, { $inc: { credits: 1 } }).session(session);
      }

      // refund learner's credits if cancelled after a credit payment
      if (status === "cancelled" && booking.paymentType === "credits" && booking.status !== "cancelled") {
        const listing = await SkillListing.findById(booking.listing).session(session);
        if (listing) {
          await User.findByIdAndUpdate(booking.learner, { $inc: { credits: listing.creditCost } }).session(session);
        }
      }

      booking.status = status;
      await booking.save({ session });
      updated = booking;
    });

    res.json(updated);
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return res.status(404).json({ message: "Booking not found" });
    if (err.message === "FORBIDDEN") return res.status(403).json({ message: "Not authorized" });
    res.status(500).json({ message: "Failed to update booking", error: err.message });
  } finally {
    session.endSession();
  }
}