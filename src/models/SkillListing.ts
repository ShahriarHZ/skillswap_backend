import mongoose, { Schema, Document } from "mongoose";

export interface ISkillListing extends Document {
  teacher: mongoose.Types.ObjectId;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  mode: "online" | "in-person";
  price: number;         // 0 if credit-only
  creditCost: number;
  imageUrl?: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
}

const skillListingSchema = new Schema<ISkillListing>(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true, maxlength: 200 },
    fullDescription: { type: String, required: true },
    category: { type: String, required: true, index: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true },
    mode: { type: String, enum: ["online", "in-person"], required: true },
    price: { type: Number, default: 0 },
    creditCost: { type: Number, default: 1 },
    imageUrl: { type: String, default: "" },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// supports your Explore page filters (category + level minimum) and search
skillListingSchema.index({ title: "text", shortDescription: "text" });

export default mongoose.model<ISkillListing>("SkillListing", skillListingSchema);