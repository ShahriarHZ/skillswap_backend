import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  listing: mongoose.Types.ObjectId;
  learner: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  scheduledAt: Date;
  paymentType: "credits" | "cash";
}

const bookingSchema = new Schema<IBooking>(
  {
    listing: { type: Schema.Types.ObjectId, ref: "SkillListing", required: true },
    learner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
    scheduledAt: { type: Date, required: true },
    paymentType: { type: String, enum: ["credits", "cash"], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>("Booking", bookingSchema);