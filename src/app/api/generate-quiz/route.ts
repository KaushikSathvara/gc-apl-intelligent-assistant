import { NextResponse } from "next/server";
import { generateQuiz } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const userApiKey = request.headers.get("x-gemini-key") || undefined;
    const { topic, lessonTitle, keyTakeaways, difficulty } = await request.json();

    if (!topic || !lessonTitle || !difficulty) {
      return NextResponse.json({ error: "topic, lessonTitle, and difficulty are required" }, { status: 400 });
    }

    const quiz = await generateQuiz(topic, lessonTitle, keyTakeaways || [], difficulty, userApiKey);
    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Quiz generation error:", error);
    const message = error instanceof Error && error.message.includes("API key")
      ? error.message
      : "Failed to generate quiz";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
