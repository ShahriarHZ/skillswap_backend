import Groq from "groq-sdk";
import { groq, MODEL } from "./client";
import { getRecommendations } from "./recommendationEngine";

const tools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_skill_recommendations",
      description: "Get personalized skill listing recommendations based on what the user wants to learn.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "What the user wants to learn or achieve" },
        },
        required: ["query"],
      },
    },
  },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function runChatAgent(userId: string, history: ChatMessage[]) {
  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are SkillSwap's learning concierge. Help users find teachers, plan learning paths, and understand how credits work (1 credit earned per session taught, spent to book sessions). Use the get_skill_recommendations tool whenever the user describes something they want to learn. Keep responses concise and friendly. After answering, suggest one natural follow-up question.",
    },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages,
    tools,
    tool_choice: "auto",
  });

  const choice = response.choices[0];
  const toolCall = choice?.message?.tool_calls?.[0];

  if (toolCall && toolCall.function.name === "get_skill_recommendations") {
    const args = JSON.parse(toolCall.function.arguments);
    const result = await getRecommendations({ userId, query: args.query });

    const followUp = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        ...messages,
        choice.message,
        {
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        },
      ],
    });

    return {
      reply: followUp.choices[0]?.message?.content ?? "Here are some options based on what you're looking for.",
      recommendations: result.recommendations,
    };
  }

  return {
    reply: choice?.message?.content ?? "I'm not sure how to help with that yet.",
    recommendations: null,
  };
}