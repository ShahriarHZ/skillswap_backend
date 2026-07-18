import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  listing: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
}

const reviewSchema = new Schema<IReview>(
  {
    listing: { type: Schema.Types.ObjectId, ref: "SkillListing", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IReview>("Review", reviewSchema);