import { describe, expect, test } from "bun:test";
import {
  calculateReadingTimeMinutes,
  parseLocaleFields,
  plannedArticleLocales,
  plannedLocales,
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
