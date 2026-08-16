import { describe, expect, test } from "bun:test";
import { planSearchDocument, searchDocumentPath } from "./search-documents";

describe("planSearchDocument", () => {
  test("upserts a published locale with title", () => {
    expect(
      planSearchDocument({
        moduleSlug: "articulos",
        recordId: 4,
        locale: "en",
        title: "Palenques",
        description: "Freedom territories",
        kind: "Article · History",
        path: "/en/articulo/palenques",
        published: true,
      }),
    ).toEqual({
      action: "upsert",
      document: {
        moduleSlug: "articulos",
        recordId: 4,
        locale: "en",
        title: "Palenques",
        summary: "Freedom territories",
        tags: "Palenques Freedom territories",
        kind: "Article · History",
        path: "/en/articulo/palenques",
        extra: null,
      },
    });
  });

  test("deletes a draft or empty locale", () => {
    expect(
      planSearchDocument({
        moduleSlug: "categorias",
        recordId: 1,
        locale: "es",
        title: "África",
        description: "El continente madre",
        kind: "Categoría",
        path: "/africa",
        published: false,
      }).action,
    ).toBe("delete");

    expect(
      planSearchDocument({
        moduleSlug: "categorias",
        recordId: 1,
        locale: "en",
        title: "",
        description: "",
        kind: "Categoría",
        path: "/en/africa",
        published: true,
      }).action,
    ).toBe("delete");
  });
});

describe("searchDocumentPath", () => {
  test("prefixes non-default locales", () => {
    expect(searchDocumentPath("es", "africa")).toBe("/africa");
    expect(searchDocumentPath("en", "africa")).toBe("/en/africa");
    expect(searchDocumentPath("es", "articulo/palenques")).toBe("/articulo/palenques");
    expect(searchDocumentPath("pt", "articulo/palenques")).toBe("/pt/articulo/palenques");
  });
});
