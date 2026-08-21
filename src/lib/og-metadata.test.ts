import { describe, expect, test } from "bun:test";
import {
  buildOgGenerateMessages,
  emptyOgMetadata,
  mergeOgMetadata,
  parseOgAiJson,
  missingOgGenerateSources,
  withOgSourceFallback,
  parseOgFromForm,
  parseOgMetadata,
  seedOgMetadata,
  serializeOgMetadata,
} from "./og-metadata";

describe("og-metadata", () => {
  test("parses JSON and ignores unknown keys", () => {
    const meta = parseOgMetadata(
      '{"title":"Quilombos","extra":1,"twitterCard":"summary_large_image"}',
    );
    expect(meta.title).toBe("Quilombos");
    expect(meta.twitterCard).toBe("summary_large_image");
    expect(meta.url).toBe("");
    expect(meta).not.toHaveProperty("extra");
  });

  test("seeds title, description, image, and twitter mirrors", () => {
    const meta = seedOgMetadata({
      title: "Quilombos y palenques",
      description: "<p>Historia viva.</p>",
      image: "/media/cover.webp",
      url: "https://afroup.com/historia/quilombos",
      type: "article",
    });
    expect(meta.type).toBe("article");
    expect(meta.description).toBe("Historia viva.");
    expect(meta.imageAlt).toBe("Quilombos y palenques");
    expect(meta.twitterTitle).toBe(meta.title);
    expect(meta.twitterImage).toBe(meta.image);
    expect(meta.twitterCard).toBe("summary_large_image");
  });

  test("reads locale-scoped form fields", () => {
    const form = new FormData();
    form.set("og_title[es]", "Título OG");
    form.set("og_twitter_card[es]", "summary");
    form.set("og_title[en]", "OG title");
    expect(parseOgFromForm(form, "es").title).toBe("Título OG");
    expect(parseOgFromForm(form, "es").twitterCard).toBe("summary");
    expect(parseOgFromForm(form, "en").title).toBe("OG title");
  });

  test("round-trips serialize/parse and merges AI patches without wiping seeds", () => {
    const seeded = seedOgMetadata({ title: "Palenque", image: "/x.jpg" });
    const json = serializeOgMetadata(seeded);
    expect(parseOgMetadata(json).title).toBe("Palenque");
    const patched = mergeOgMetadata(seeded, parseOgAiJson('```json\n{"title":"Palenques vivos","url":"https://afroup.com/x"}\n```')!);
    expect(patched.title).toBe("Palenques vivos");
    expect(patched.image).toBe("/x.jpg");
    expect(patched.url).toBe("https://afroup.com/x");
  });

  test("missingOgGenerateSources requires article title, description, tags, category, and content", () => {
    expect(
      missingOgGenerateSources("article", {
        title: "",
        description: "",
        content: "<p></p>",
        tags: "  ",
        categories: [],
      }),
    ).toEqual(["title", "description", "content", "tags", "categories"]);
    expect(
      missingOgGenerateSources("article", {
        title: "Quilombos",
        description: "Historia",
        content: "<p>Cimarronaje</p>",
        tags: "diáspora",
        categories: ["3"],
      }),
    ).toEqual([]);
    expect(missingOgGenerateSources("category", { title: "África", description: "" })).toEqual([
      "description",
    ]);
    const resolved = withOgSourceFallback(
      { title: "", description: "" },
      { title: "África", description: "Continente" },
    );
    expect(missingOgGenerateSources("category", resolved)).toEqual([]);
    expect(resolved.title).toBe("África");
  });

  test("buildOgGenerateMessages asks for JSON keys and uses title/description/content", () => {
    const messages = buildOgGenerateMessages({
      title: "Quilombos",
      description: "Historia",
      content: "<p>Cimarronaje</p>",
      locale: "es",
      kind: "article",
    });
    expect(messages[0]?.content).toContain("twitterCard");
    expect(messages[0]?.content).toContain("requested locale");
    expect(messages[1]?.content).toContain("Locale: es");
    expect(messages[1]?.content).toContain("Quilombos");
    expect(messages[1]?.content).toContain("Cimarronaje");
    expect(emptyOgMetadata().twitterDescription).toBe("");
  });
});
