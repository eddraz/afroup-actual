import { dictionaries, type Dictionary } from "./i18n";

export const TRANSLATION_MODEL = "@cf/deepseek-ai/deepseek-v4-pro-0813";

type AiRunner = {
  run(
    model: string,
    input: { messages: Array<{ role: string; content: string }> },
  ): Promise<unknown>;
};

function sourceDictionary(): Record<string, string> {
  return { ...(dictionaries.es as unknown as Record<string, string>) };
}

function extractContent(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const choices = record.choices;
  if (Array.isArray(choices) && choices[0] && typeof choices[0] === "object") {
    const message = (choices[0] as { message?: { content?: unknown } }).message;
    if (typeof message?.content === "string") return message.content;
  }
  if (typeof record.response === "string") return record.response;
  return null;
}

function parseJsonObject(raw: string): Record<string, string> | null {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string") out[key] = value;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

export async function translateUiDictionary(
  ai: AiRunner,
  targetCode: string,
  targetName: string,
): Promise<Record<string, string>> {
  const source = sourceDictionary();
  const payload = await ai.run(TRANSLATION_MODEL, {
    messages: [
      {
        role: "system",
        content:
          "You translate website UI dictionaries. Return only a JSON object with the same keys. Keep brand names like AfroUp. Do not wrap the JSON in markdown.",
      },
      {
        role: "user",
        content: `Translate these Spanish UI strings into ${targetName} (${targetCode}):\n${JSON.stringify(source)}`,
      },
    ],
  });
  const content = extractContent(payload);
  const translated = content ? parseJsonObject(content) : null;
  if (!translated) {
    throw new Error("translate_failed");
  }
  return { ...source, ...translated };
}

export function dictionaryAsJson(dictionary: Record<string, string> | Dictionary): string {
  return JSON.stringify(dictionary);
}
