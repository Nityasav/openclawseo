import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY ?? "placeholder-gemini-key";
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export function getGeminiModel(): GenerativeModel {
  return getGeminiClient().getGenerativeModel({ model: GEMINI_MODEL });
}

export const GEMINI_MODEL = "gemini-2.0-flash";
