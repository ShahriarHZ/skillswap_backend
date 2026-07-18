import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";
import { hashPassword } from "../utils/hash";
import SkillListing from "../models/SkillListing";
dotenv.config();

const sampleSkills = [
  { title: "Intro to Film Photography", shortDescription: "Learn manual exposure on a real film camera.", fullDescription: "A hands-on session covering aperture, shutter speed, and ISO using 35mm film. Bring your own camera or borrow one of mine.", category: "Photography", level: "beginner", mode: "in-person", price: 0, creditCost: 2 },
  { title: "Acoustic Guitar Basics", shortDescription: "Chords, strumming, and your first song in one session.", fullDescription: "Perfect for absolute beginners. We'll cover open chords, basic strumming patterns, and play through a simple song together.", category: "Music", level: "beginner", mode: "online", price: 10, creditCost: 1 },
  { title: "Conversational Mandarin", shortDescription: "Practical phrases for everyday conversations.", fullDescription: "Focus on real spoken Mandarin — greetings, ordering food, asking directions. No prior experience needed.", category: "Languages", level: "beginner", mode: "online", price: 0, creditCost: 2 },
  { title: "Wheel Throwing Pottery", shortDescription: "Center your first bowl on the pottery wheel.", fullDescription: "A studio session covering centering, pulling, and shaping clay on the wheel. Apron and clay provided.", category: "Art & Craft", level: "beginner", mode: "in-person", price: 25, creditCost: 3 },
];

async function seedSkills() {
  const demoUser = await User.findOne({ email: "demo@skillswap.com" });
  if (!demoUser) return;

  const existing = await SkillListing.countDocuments();
  if (existing === 0) {
    await SkillListing.insertMany(sampleSkills.map((s) => ({ ...s, teacher: demoUser._id })));
    console.log("Sample skills seeded");
  } else {
    console.log("Skills already exist, skipping");
  }
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI as string);

  const exists = await User.findOne({ email: "demo@skillswap.com" });
  if (!exists) {
    await User.create({
      name: "Demo User",
      email: "demo@skillswap.com",
      password: await hashPassword("demo1234"),
      credits: 20,
    });
    console.log("Demo user seeded");
  } else {
    console.log("Demo user already exists");
  }

  await seedSkills();

  process.exit(0);
}

seed();