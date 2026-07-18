import mongoose, { Schema, Document } from "mongoose";

export interface IChatSession extends Document {
  user: mongoose.Types.ObjectId;
  messages: { role: "user" | "assistant"; content: string; createdAt: Date }[];
}

const chatSessionSchema = new Schema<IChatSession>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IChatSession>("ChatSession", chatSessionSchema);