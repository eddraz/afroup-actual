import { describe, expect, test } from "bun:test";
import {
  EDITORIAL_AI_MODEL,
  buildEditorialAiMessages,
  missingEditorialAiPrompt,
  normalizeEditorialAiResult,
  parseEditorialAiJson,
} from "./editorial-ai";

describe("editorial-ai", () => {
  test("uses the flash-0731 model", () => {
    expect(EDITORIAL_AI_MODEL).toBe("@cf/deepseek-ai/deepseek-v4-flash-0731");
  });

  test("missingEditorialAiPrompt is true for blank prompts", () => {
    expect(missingEditorialAiPrompt("")).toBe(true);
    expect(missingEditorialAiPrompt("   ")).toBe(true);
    expect(missingEditorialAiPrompt("\n\t")).toBe(true);
    expect(missingEditorialAiPrompt("Quilombos y palenques en Abya Yala")).toBe(false);
  });

  test("parseEditorialAiJson strips markdown fences and ignores unknown keys", () => {
    const parsed = parseEditorialAiJson(
      '```json\n{"title":"Quilombos","extra":1,"slug":"quilombos","description":"Historia viva."}\n```',
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.title).toBe("Quilombos");
    expect(parsed?.slug).toBe("quilombos");
    expect(parsed?.description).toBe("Historia viva.");
    expect(parsed).not.toHaveProperty("extra");
  });

  test("normalizeEditorialAiResult accepts nested og and article fields", () => {
    const result = normalizeEditorialAiResult("article", {
      title: "Quilombos y palenques",
      description: "Una bajada editorial.",
      slug: "Quilombos Y Palenques",
      tags: ["diáspora", "historia"],
      content: "<h2>Memoria</h2><p>El cimarronaje sigue vivo.</p>",
      unused: true,
      og: {
        url: "https://afroup.com/historia/quilombos-y-palenques",
        type: "article",
        title: "OG title",
        description: "OG description",
        extra: "nope",
      },
    });
    expect(result.title).toBe("Quilombos y palenques");
    expect(result.description).toBe("Una bajada editorial.");
    expect(result.slug).toBe("quilombos-y-palenques");
    expect(result.tags).toBe("diáspora, historia");
    expect(result.content).toContain("<h2>Memoria</h2>");
    expect(result.og.title).toBe("OG title");
    expect(result.og.type).toBe("article");
    expect(result.og.url).toBe("https://afroup.com/historia/quilombos-y-palenques");
    expect(result.og).not.toHaveProperty("extra");
  });

  test("normalizeEditorialAiResult accepts flattened og_ keys and category shape", () => {
    const result = normalizeEditorialAiResult("category", {
      title: "África",
      description: "Continente y memoria.",
      slug: "africa",
      tags: "should-not-appear",
      content: "<p>should not appear</p>",
      og_title: "África | AfroUp",
      og_description: "Categoria OG",
      og_type: "website",
      og_twitter_card: "summary",
    });
    expect(result.title).toBe("África");
    expect(result.slug).toBe("africa");
    expect(result).not.toHaveProperty("tags");
    expect(result).not.toHaveProperty("content");
    expect(result.og.title).toBe("África | AfroUp");
    expect(result.og.description).toBe("Categoria OG");
    expect(result.og.type).toBe("website");
    expect(result.og.twitterCard).toBe("summary");
  });

  test("buildEditorialAiMessages include locale, kind, prompt, and AfroUp instruction", () => {
    const messages = buildEditorialAiMessages({
      kind: "article",
      locale: "es",
      prompt: "Escribe sobre palenques en el Caribe",
    });
    const system = String(messages[0]?.content ?? "");
    const user = String(messages[1]?.content ?? "");
    expect(system).toContain("AfroUp");
    expect(system.toLowerCase()).toContain("untranslated");
    expect(user).toContain("Locale: es");
    expect(user).toContain("Kind: article");
    expect(user).toContain("Escribe sobre palenques en el Caribe");
  });

  test("buildEditorialAiMessages treat existing fields as a rewrite brief", () => {
    const messages = buildEditorialAiMessages({
      kind: "category",
      locale: "en",
      prompt: "Make it more concise",
      existing: {
        title: "Diaspora",
        description: "A long category dek.",
        slug: "diaspora",
      },
    });
    const system = String(messages[0]?.content ?? "");
    const user = String(messages[1]?.content ?? "");
    expect(system.toLowerCase()).toContain("rewrite");
    expect(user).toContain("Kind: category");
    expect(user).toContain("Locale: en");
    expect(user).toContain("Make it more concise");
    expect(user).toContain("Diaspora");
  });
});
