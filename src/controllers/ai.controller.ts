import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { runChatAgent } from "../services/ai/chatAgent";
import ChatSession from "../models/ChatSession";

export async function chat(req: AuthRequest, res: Response) {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    let session = await ChatSession.findOne({ user: req.userId });
    if (!session) {
      session = await ChatSession.create({ user: req.userId, messages: [] });
    }

    session.messages.push({ role: "user", content: message, createdAt: new Date() });

    const history = session.messages.map((m) => ({ role: m.role, content: m.content }));

    const { reply, recommendations } = await runChatAgent(req.userId as string, history);

    session.messages.push({ role: "assistant", content: reply, createdAt: new Date() });
    await session.save();

    res.json({ reply, recommendations, history: session.messages });
  } catch (err) {
    res.status(500).json({ message: "Chat failed", error: (err as Error).message });
  }
}

export async function getChatHistory(req: AuthRequest, res: Response) {
  try {
    const session = await ChatSession.findOne({ user: req.userId });
    res.json(session?.messages ?? []);
  } catch (err) {
    res.status(500).json({ message: "Failed to load chat history", error: (err as Error).message });
  }
}