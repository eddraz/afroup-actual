import { describe, expect, test } from "bun:test";
import {
  buildCoverImageContext,
  buildImproveImagePromptMessages,
  encodeTextFile,
  extractGeneratedImageRef,
  extractGeneratedMediaRef,
  parseAiFileKind,
  parseImprovedPrompt,
  pickAllowedModel,
  IMAGE_GENERATE_MODEL,
  IMAGE_PROMPT_MODEL,
} from "./ai-media";

describe("ai-media cover context", () => {
  test("requires custom text or at least one filled form field", () => {
    expect(buildCoverImageContext({ source: "custom", customText: "  " })).toEqual({
      ok: false,
      error: "custom_required",
    });
    expect(
      buildCoverImageContext({
        source: "form",
        selected: ["title", "tags"],
        fields: { title: "", tags: "" },
      }),
    ).toEqual({ ok: false, error: "fields_required" });
    expect(buildCoverImageContext({ source: "custom", customText: "Mujer palenquera al amanecer" }).ok).toBe(true);
    const mixed = buildCoverImageContext({
      source: "form",
      customText: "Luz dorada",
      selected: ["title"],
      fields: { title: "Quilombos" },
    });
    expect(mixed.ok).toBe(true);
    if (mixed.ok) {
      expect(mixed.context).toContain("Luz dorada");
      expect(mixed.context).toContain("Quilombos");
    }
    const fromForm = buildCoverImageContext({
      source: "form",
      selected: ["title", "content"],
      fields: { title: "Quilombos", content: "<p>Cimarronaje</p>" },
    });
    expect(fromForm.ok).toBe(true);
    if (fromForm.ok) {
      expect(fromForm.context).toContain("Quilombos");
      expect(fromForm.context).toContain("Cimarronaje");
    }
  });

  test("improves prompts in English and extracts grok image URLs", () => {
    const messages = buildImproveImagePromptMessages("Historia de palenques");
    expect(messages[0]?.content).toContain("English");
    expect(parseImprovedPrompt({ response: "A cinematic dawn over a palenque" })).toBe(
      "A cinematic dawn over a palenque",
    );
    expect(
      extractGeneratedImageRef({
        state: "Completed",
        result: { image: "https://example.com/cover.png" },
      }),
    ).toEqual({ url: "https://example.com/cover.png" });
    expect(pickAllowedModel("evil/model", [IMAGE_PROMPT_MODEL], IMAGE_PROMPT_MODEL)).toBe(IMAGE_PROMPT_MODEL);
    expect(pickAllowedModel(IMAGE_GENERATE_MODEL, [IMAGE_GENERATE_MODEL], IMAGE_GENERATE_MODEL)).toBe(
      IMAGE_GENERATE_MODEL,
    );
    expect(parseAiFileKind("video")).toBe("video");
    expect(
      extractGeneratedMediaRef({ result: { video: "https://example.com/clip.mp4" } }, "video"),
    ).toEqual({ url: "https://example.com/clip.mp4" });
    expect(
      extractGeneratedMediaRef({ result: { audio: "https://example.com/song.mp3" } }, "music"),
    ).toEqual({ url: "https://example.com/song.mp3" });
    const csv = encodeTextFile("name,role\nAda,Editor", "csv");
    expect(csv.ext).toBe("csv");
    expect(new TextDecoder().decode(csv.bytes)).toContain("Ada");
    expect(encodeTextFile("Hola", "pdf").contentType).toBe("application/pdf");
  });
});
