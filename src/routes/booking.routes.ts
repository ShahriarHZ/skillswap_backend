import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createBooking, getMyBookings, getTeachingBookings, updateBookingStatus,
} from "../controllers/booking.controller";

const router = Router();

router.post("/", requireAuth, createBooking);
router.get("/mine", requireAuth, getMyBookings);
router.get("/teaching", requireAuth, getTeachingBookings);
router.patch("/:id/status", requireAuth, updateBookingStatus);

export default router;