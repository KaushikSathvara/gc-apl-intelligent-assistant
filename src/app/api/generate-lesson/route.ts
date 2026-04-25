import { NextResponse } from "next/server";
import { generateLesson } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const userApiKey = request.headers.get("x-gemini-key") || undefined;
    const { topic, stepTitle, difficulty, previousSteps } = await request.json();

    if (!topic || !stepTitle || !difficulty) {
      return NextResponse.json({ error: "topic, stepTitle, and difficulty are required" }, { status: 400 });
    }

    const lesson = await generateLesson(topic, stepTitle, difficulty, previousSteps || [], userApiKey);
    return NextResponse.json(lesson);
  } catch (error) {
    console.error("Lesson generation error:", error);
    const message = error instanceof Error && error.message.includes("API key")
      ? error.message
      : "Failed to generate lesson";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
