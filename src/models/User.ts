import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;       // optional because Google-auth users won't have one
  googleId?: string;
  avatar?: string;
  credits: number;
  role: "user" | "admin";
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false }, // never returned by default
    googleId: { type: String },
    avatar: { type: String, default: "" },
    credits: { type: Number, default: 5 }, // starter credits for the exchange system
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);