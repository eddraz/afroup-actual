import { describe, expect, test } from "bun:test";
import { getCategoryTheme, isReservedCategorySlug } from "./category-routes";

describe("isReservedCategorySlug", () => {
  test("blocks existing public and admin routes", () => {
    expect(isReservedCategorySlug("tienda")).toBe(true);
    expect(isReservedCategorySlug("admin")).toBe(true);
    expect(isReservedCategorySlug("articulo")).toBe(true);
    expect(isReservedCategorySlug("en")).toBe(true);
    expect(isReservedCategorySlug("login")).toBe(true);
  });

  test("allows editorial category slugs including former mock pages", () => {
    expect(isReservedCategorySlug("africa")).toBe(false);
    expect(isReservedCategorySlug("historia")).toBe(false);
    expect(isReservedCategorySlug("diaspora")).toBe(false);
  });
});

describe("getCategoryTheme", () => {
  test("maps category slugs to their menu brand colors", () => {
    expect(getCategoryTheme("africa")).toEqual({ textClass: "text-primary", dotClass: "bg-primary" });
    expect(getCategoryTheme("diaspora")).toEqual({ textClass: "text-accent", dotClass: "bg-accent" });
    expect(getCategoryTheme("antirracismo")).toEqual({ textClass: "text-secondary", dotClass: "bg-secondary" });
    expect(getCategoryTheme("historia")).toEqual({ textClass: "text-secondary", dotClass: "bg-secondary" });
    expect(getCategoryTheme("estetica")).toEqual({ textClass: "text-accent", dotClass: "bg-accent" });
    expect(getCategoryTheme("actualidad")).toEqual({ textClass: "text-primary", dotClass: "bg-primary" });
  });

  test("falls back to primary theme for unknown category", () => {
    expect(getCategoryTheme("unknown")).toEqual({ textClass: "text-primary", dotClass: "bg-primary" });
  });
});
