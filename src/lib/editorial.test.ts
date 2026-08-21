import { describe, expect, test } from "bun:test";
import {
  calculateReadingTimeMinutes,
  parseLocaleFields,
  plannedArticleLocales,
  plannedLocales,
  validateArticleInput,
  visibleOwnerClause,
} from "./editorial";

describe("calculateReadingTimeMinutes", () => {
  test("returns 1 for short or empty text", () => {
    expect(calculateReadingTimeMinutes("")).toBe(1);
    expect(calculateReadingTimeMinutes("Hola mundo")).toBe(1);
  });

  test("strips HTML tags and calculates minutes based on word count", () => {
    const words200 = Array(200).fill("palabra").join(" ");
    expect(calculateReadingTimeMinutes(words200)).toBe(1);
    const words450 = Array(450).fill("<span>palabra</span>").join(" ");
    expect(calculateReadingTimeMinutes(words450)).toBe(3);
  });
});

describe("parseLocaleFields", () => {
  test("extracts 2-letter locale keys from FormData", () => {
    const form = new FormData();
    form.append("title[es]", "Título en español");
    form.append("title[en]", "English Title");
    form.append("title[invalid]", "Ignored");
    form.append("content_html[es]", "<p>Contenido</p>");

    expect(parseLocaleFields(form, "title")).toEqual({
      es: "Título en español",
      en: "English Title",
    });
    expect(parseLocaleFields(form, "content_html")).toEqual({
      es: "<p>Contenido</p>",
    });
  });
});

describe("plannedArticleLocales", () => {
  test("combines title, description, and content_html for allowed locales", () => {
    const titles = { es: "Título", en: "Title" };
    const descriptions = { es: "Resumen", en: "Summary" };
    const contents = { es: "<p>Hola</p>", en: "<p>Hello</p>" };

    const result = plannedArticleLocales(
      titles,
      descriptions,
      contents,
      {},
      {},
      {},
      { canWrite: true, canUseAi: false },
    );

    expect(result).toEqual([
      { locale: "es", title: "Título", description: "Resumen", content_html: "<p>Hola</p>" },
      { locale: "en", title: "Title", description: "Summary", content_html: "<p>Hello</p>" },
    ]);
  });
});

describe("visibleOwnerClause", () => {
  test("resolves default created_by and id", () => {
    expect(visibleOwnerClause()).toBe(
      "(created_by = ? OR created_by IS NULL OR id IN (SELECT record_id FROM record_shares WHERE module_slug = ? AND shared_with_id = ?))",
    );
  });

  test("auto-resolves table alias for idColumn when ownerColumn is qualified", () => {
    expect(visibleOwnerClause("a.created_by")).toBe(
      "(a.created_by = ? OR a.created_by IS NULL OR a.id IN (SELECT record_id FROM record_shares WHERE module_slug = ? AND shared_with_id = ?))",
    );
    expect(visibleOwnerClause("c.created_by")).toBe(
      "(c.created_by = ? OR c.created_by IS NULL OR c.id IN (SELECT record_id FROM record_shares WHERE module_slug = ? AND shared_with_id = ?))",
    );
  });
});

describe("validateArticleInput", () => {
  test("allows saving a draft with only the title", () => {
    const res = validateArticleInput({
      status: "draft",
      primaryTitle: "Mi primer borrador",
      primaryDescription: "",
      primaryContent: "",
      categoryIds: [],
      tags: [],
      coverImageUrl: null,
      slug: "mi-primer-borrador",
    });
    expect(res.ok).toBe(true);
  });

  test("rejects saving a draft without a title", () => {
    const res = validateArticleInput({
      status: "draft",
      primaryTitle: "   ",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("title_required");
  });

  test("allows publishing when all fields are complete", () => {
    const res = validateArticleInput({
      status: "published",
      primaryTitle: "Historia de los Palenques",
      primaryDescription: "Territorios de libertad en el Caribe y América Latina.",
      primaryContent: "<p>Los palenques fueron comunidades organizadas...</p>",
      categoryIds: [1],
      tags: ["historia", "resistencia"],
      coverImageUrl: "/api/media/covers/palenques.webp",
      slug: "historia-de-los-palenques",
    });
    expect(res.ok).toBe(true);
  });

  test("rejects publishing when title is missing", () => {
    const res = validateArticleInput({
      status: "published",
      primaryTitle: "",
      primaryDescription: "Descripción",
      primaryContent: "<p>Contenido</p>",
      categoryIds: [1],
      tags: ["historia"],
      coverImageUrl: "https://example.com/cover.jpg",
      slug: "slug-valido",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("title_required");
  });

  test("rejects publishing when description is missing", () => {
    const res = validateArticleInput({
      status: "published",
      primaryTitle: "Título",
      primaryDescription: "   ",
      primaryContent: "<p>Contenido</p>",
      categoryIds: [1],
      tags: ["historia"],
      coverImageUrl: "https://example.com/cover.jpg",
      slug: "slug-valido",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("description_required");
  });

  test("rejects publishing when content is empty or contains only HTML tags/spaces", () => {
    const res = validateArticleInput({
      status: "published",
      primaryTitle: "Título",
      primaryDescription: "Descripción",
      primaryContent: "<p>&nbsp;   </p>",
      categoryIds: [1],
      tags: ["historia"],
      coverImageUrl: "https://example.com/cover.jpg",
      slug: "slug-valido",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("content_required");
  });

  test("rejects publishing when no categories are selected", () => {
    const res = validateArticleInput({
      status: "published",
      primaryTitle: "Título",
      primaryDescription: "Descripción",
      primaryContent: "<p>Contenido</p>",
      categoryIds: [],
      tags: ["historia"],
      coverImageUrl: "https://example.com/cover.jpg",
      slug: "slug-valido",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("category_required");
  });

  test("rejects publishing when no tags are provided", () => {
    const res = validateArticleInput({
      status: "published",
      primaryTitle: "Título",
      primaryDescription: "Descripción",
      primaryContent: "<p>Contenido</p>",
      categoryIds: [1],
      tags: [],
      coverImageUrl: "https://example.com/cover.jpg",
      slug: "slug-valido",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("tags_required");
  });

  test("rejects publishing when cover image is missing", () => {
    const res = validateArticleInput({
      status: "published",
      primaryTitle: "Título",
      primaryDescription: "Descripción",
      primaryContent: "<p>Contenido</p>",
      categoryIds: [1],
      tags: ["historia"],
      coverImageUrl: "",
      slug: "slug-valido",
    });
    expect(res.ok).toBe(false);
    expect(res.error).toBe("cover_image_required");
  });

  test("rejects publishing when slug is missing or invalid", () => {
    const emptySlug = validateArticleInput({
      status: "published",
      primaryTitle: "Título",
      primaryDescription: "Descripción",
      primaryContent: "<p>Contenido</p>",
      categoryIds: [1],
      tags: ["historia"],
      coverImageUrl: "https://example.com/cover.jpg",
      slug: "",
    });
    expect(emptySlug.ok).toBe(false);
    expect(emptySlug.error).toBe("slug_required");

    const invalidSlug = validateArticleInput({
      status: "published",
      primaryTitle: "Título",
      primaryDescription: "Descripción",
      primaryContent: "<p>Contenido</p>",
      categoryIds: [1],
      tags: ["historia"],
      coverImageUrl: "https://example.com/cover.jpg",
      slug: "slug_invalido_con_underscores!",
    });
    expect(invalidSlug.ok).toBe(false);
    expect(invalidSlug.error).toBe("slug_invalid");
  });
});

