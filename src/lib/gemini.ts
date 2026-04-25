import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";

const SYSTEM_INSTRUCTION = `You are LearnQuest, a concise educational AI. Generate structured learning content.
CRITICAL RULES:
- Respond ONLY with raw, valid JSON. No markdown, no code fences, no explanations.
- Do NOT wrap JSON in \`\`\`json blocks.
- Output must start with { and end with }.`;

const defaultConfig: GenerationConfig = {
  temperature: 0.7,
  topP: 0.9,
  maxOutputTokens: 1024,
};

/**
 * Resolves the API key: prefers user-provided key, falls back to env var.
 */
function resolveApiKey(userApiKey?: string): string {
  const key = userApiKey || process.env.GEMINI_API_KEY || "";
  if (!key) {
    throw new Error("No Gemini API key configured. Please add your API key in Settings or set the GEMINI_API_KEY environment variable.");
  }
  return key;
}

/**
 * Extracts JSON from a response that may contain markdown or other text.
 */
function extractJSON(text: string): unknown {
  // Try direct parse first
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // ignore
  }

  // Try extracting from ```json ... ``` code blocks
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // ignore
    }
  }

  // Try finding first { ... } or [ ... ] block
  const jsonMatch = trimmed.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      // ignore
    }
  }

  throw new Error(`Failed to parse JSON from model response: ${trimmed.substring(0, 200)}...`);
}

/**
 * Retries a function with exponential backoff on 429/503 errors.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const is429 = error instanceof Error && (
        error.message.includes("429") ||
        error.message.includes("Resource has been exhausted") ||
        error.message.includes("Too Many Requests") ||
        error.message.includes("503")
      );

      if (is429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(`Rate limited (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function generateCurriculum(topic: string, difficulty: string, priorKnowledge: string, apiKey?: string) {
  const genAI = new GoogleGenerativeAI(resolveApiKey(apiKey));
  const model = genAI.getGenerativeModel({
    model: "gemma-4-31b-it",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { ...defaultConfig, maxOutputTokens: 800 },
  });

  const prompt = `Create a learning curriculum for "${topic}" at ${difficulty} level. Prior knowledge: ${priorKnowledge || "none"}.
Respond with ONLY this JSON (no other text):
{"description":"brief topic description","steps":[{"title":"step name","type":"lesson"|"quiz","xpReward":50|100,"estimatedMinutes":5-15}]}
Generate 8-12 steps alternating lessons and quizzes. Start with a lesson.`;

  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  });
}

export async function generateLesson(topic: string, stepTitle: string, difficulty: string, previousSteps: string[], apiKey?: string) {
  const genAI = new GoogleGenerativeAI(resolveApiKey(apiKey));
  const model = genAI.getGenerativeModel({
    model: "gemma-4-31b-it",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { ...defaultConfig, maxOutputTokens: 1200 },
  });

  const context = previousSteps.length > 0 ? `Previous topics covered: ${previousSteps.join(", ")}.` : "";
  const prompt = `Write a concise lesson on "${stepTitle}" for the topic "${topic}" at ${difficulty} level. ${context}
Respond with ONLY this JSON (no other text):
{"content":"lesson in markdown (use headers, bullets, code blocks)","keyTakeaways":["3-5 key points"]}
Keep the lesson focused, 300-500 words. Use examples.`;

  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  });
}

export async function generateQuiz(topic: string, lessonTitle: string, keyTakeaways: string[], difficulty: string, apiKey?: string) {
  const genAI = new GoogleGenerativeAI(resolveApiKey(apiKey));
  const model = genAI.getGenerativeModel({
    model: "gemma-4-31b-it",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { ...defaultConfig, maxOutputTokens: 800 },
  });

  const prompt = `Create a quiz about "${lessonTitle}" in "${topic}" at ${difficulty} level.
Key concepts: ${keyTakeaways.join("; ")}.
Respond with ONLY this JSON (no other text):
{"questions":[{"question":"text","options":["4 choices"],"correctIndex":0-3,"explanation":"why correct"}]}
Generate exactly 5 multiple-choice questions. Vary difficulty.`;

  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  });
}
