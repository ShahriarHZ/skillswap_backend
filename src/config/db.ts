import mongoose from "mongoose";

export async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB connected to database:", conn.connection.name);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}