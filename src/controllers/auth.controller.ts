import { Request, Response } from "express";
import User from "../models/User";
import { hashPassword, comparePassword } from "../utils/hash";
import { signToken } from "../utils/jwt";
import { AuthRequest } from "../middleware/auth.middleware";

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const hashed = await hashPassword(password);
    const user = await User.create({ name, email, password: hashed });

    const token = signToken(user._id.toString());
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, credits: user.credits },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: (err as Error).message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await comparePassword(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user._id.toString());
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, credits: user.credits },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: (err as Error).message });
  }
}

// used by your "Demo login" button — pre-seeded account, see seed script below
export async function demoLogin(req: Request, res: Response) {
  try {
    const user = await User.findOne({ email: "demo@skillswap.com" });
    if (!user) return res.status(404).json({ message: "Demo account not seeded yet" });

    const token = signToken(user._id.toString());
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, credits: user.credits },
    });
  } catch (err) {
    res.status(500).json({ message: "Demo login failed", error: (err as Error).message });
  }
}
export async function getMe(req: AuthRequest, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ id: user._id, name: user.name, email: user.email, credits: user.credits });
}
export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const { name, avatar } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name.trim();
    if (avatar !== undefined) user.avatar = avatar;

    await user.save({ validateModifiedOnly: true });

    res.json({ id: user._id, name: user.name, email: user.email, credits: user.credits, avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: (err as Error).message });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.userId).select("+password");
    if (!user || !user.password) {
      return res.status(400).json({ message: "Password change isn't available for Google-linked accounts" });
    }

    const match = await comparePassword(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = await hashPassword(newPassword);
    await user.save({ validateModifiedOnly: true });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to change password", error: (err as Error).message });
  }
}