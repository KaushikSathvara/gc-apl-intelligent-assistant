import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ valid: false, error: "API key is required" }, { status: 400 });
    }

    // Use the lightweight listModels endpoint — doesn't count against generation rate limits
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { method: "GET" }
    );

    if (res.ok) {
      return NextResponse.json({ valid: true });
    }

    const data = await res.json().catch(() => ({}));
    const message = data?.error?.message || "Invalid API key";
    return NextResponse.json({ valid: false, error: message });
  } catch (error) {
    console.error("API key validation error:", error);
    return NextResponse.json({ valid: false, error: "Could not validate API key" });
  }
}
