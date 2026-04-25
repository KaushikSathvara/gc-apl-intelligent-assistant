import { NextResponse } from "next/server";
import { generateCurriculum } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const userApiKey = request.headers.get("x-gemini-key") || undefined;
    const { topic, difficulty, priorKnowledge } = await request.json();

    if (!topic || !difficulty) {
      return NextResponse.json({ error: "topic and difficulty are required" }, { status: 400 });
    }

    const curriculum = await generateCurriculum(topic, difficulty, priorKnowledge || "", userApiKey);
    return NextResponse.json(curriculum);
  } catch (error) {
    console.error("Curriculum generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate curriculum";
    const status = message.includes("429") || message.includes("exhausted") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
