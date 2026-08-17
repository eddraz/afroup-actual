import { describe, expect, test } from "bun:test";
import { planSearchDocument, searchDocumentPath } from "./search-documents";
import { parseTagList } from "./slugs";

describe("planSearchDocument", () => {
  test("upserts a published locale with title and tags", () => {
    expect(
      planSearchDocument({
        moduleSlug: "articulos",
        recordId: 4,
        locale: "en",
        title: "Palenques",
        description: "Freedom territories",
        kind: "Article · History",
        path: "/en/africa/palenques",
        published: true,
        tags: ["palenque", "cimarronaje"],
      }),
    ).toEqual({
      action: "upsert",
      document: {
        moduleSlug: "articulos",
        recordId: 4,
        locale: "en",
        title: "Palenques",
        summary: "Freedom territories",
        tags: "Palenques Freedom territories palenque cimarronaje",
        kind: "Article · History",
        path: "/en/africa/palenques",
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
    expect(searchDocumentPath("es", "africa/palenques")).toBe("/africa/palenques");
    expect(searchDocumentPath("pt", "africa/palenques")).toBe("/pt/africa/palenques");
  });
});

describe("parseTagList", () => {
  test("splits, slugs, and dedupes tags", () => {
    expect(parseTagList("Palenque, cimarronaje, palenque, #Historia viva")).toEqual([
      "palenque",
      "cimarronaje",
      "historia-viva",
    ]);
  });
});
