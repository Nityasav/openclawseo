import { getGeminiModel } from "./client";

export async function generateStructuredJSON<T = unknown>(
  prompt: string
): Promise<T> {
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Strip markdown code blocks if present
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

export async function generateText(prompt: string): Promise<string> {
  const model = getGeminiModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
}
