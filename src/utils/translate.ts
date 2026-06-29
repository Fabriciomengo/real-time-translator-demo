import { LanguageCode, languageNameMap } from "./language";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function translateText(
  text: string,
  targetLanguage: LanguageCode
): Promise<string> {
  const startedAt = performance.now();

  try {
    const languageName = languageNameMap[targetLanguage] || targetLanguage;

    console.debug("[translateText] Request started", {
      targetLanguage,
      languageName,
      characterCount: text.length,
    });

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
            content: `Translate to ${languageName}. Simple and Direct`,
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

    const responseReceivedAt = performance.now();

    if (!response.ok) {
      const errorBody = await response.text();

      console.error("[translateText] Request failed", {
        status: response.status,
        statusText: response.statusText,
        durationMs: Math.round(responseReceivedAt - startedAt),
        errorBody,
      });

      return "";
    }

    const result = (await response.json()) as GroqResponse;
    const translatedText = result.choices[0]?.message?.content?.trim() || "";

    console.debug("[translateText] Request completed", {
      fetchDurationMs: Math.round(responseReceivedAt - startedAt),
      totalDurationMs: Math.round(performance.now() - startedAt),
      translatedCharacterCount: translatedText.length,
    });

    return translatedText;
  } catch (error) {
    console.error("[translateText] Error translating text", {
      durationMs: Math.round(performance.now() - startedAt),
      error,
    });

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