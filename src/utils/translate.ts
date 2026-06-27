import { LanguageCode, languageNameMap } from "./language";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function translateText(
  text: string,
  targetLanguage: LanguageCode
): Promise<string> {
  try {
    const languageName = languageNameMap[targetLanguage] || targetLanguage;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: `You are a real-time translator. Translate the following text to ${languageName}. Return ONLY the translated text, nothing else. No explanations, no quotes, no extra text.`,
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.1,
        max_tokens: 512,
      }),
    });

    const result = (await response.json()) as GroqResponse;
    return result.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("Error translating text:", error);
    return "";
  }
}

type GroqResponse = {
  choices: {
    message: {
      content: string;
    };
  }[];
};