import { describe, expect, it } from "bun:test";
import {
  ENTREPRENEUR_CATEGORIES,
  OFFERING_KINDS,
  formatPrice,
  parseSpecs,
  serializeSpecs,
  slugifyEntrepreneur,
} from "./entrepreneurs";

describe("entrepreneurs library helpers", () => {
  it("slugifyEntrepreneur generates clean URL slugs stripping diacritics", () => {
    expect(slugifyEntrepreneur("Tejidos Ubuntu")).toBe("tejidos-ubuntu");
    expect(slugifyEntrepreneur("Café Cimarrón")).toBe("cafe-cimarron");
    expect(slugifyEntrepreneur("Crespa & Libre")).toBe("crespa-libre");
    expect(slugifyEntrepreneur("  Taller   de telar  ")).toBe("taller-de-telar");
    expect(slugifyEntrepreneur("Ñango Ñame")).toBe("nango-name");
    expect(slugifyEntrepreneur("Memoria viva: rutas del cimarronaje")).toBe("memoria-viva-rutas-del-cimarronaje");
    expect(slugifyEntrepreneur("")).toBe("emprendimiento");
  });

  it("parseSpecs returns a safe array of {label, value} string pairs", () => {
    expect(parseSpecs('[{"label":"Material","value":"Algodón"}]')).toEqual([
      { label: "Material", value: "Algodón" },
    ]);
    expect(parseSpecs("not json")).toEqual([]);
    expect(parseSpecs('{"label":"nope"}')).toEqual([]);
    expect(parseSpecs("42")).toEqual([]);
    expect(parseSpecs("null")).toEqual([]);
    expect(parseSpecs("[]")).toEqual([]);
    expect(parseSpecs("")).toEqual([]);
    expect(parseSpecs(null)).toEqual([]);
    expect(parseSpecs(undefined)).toEqual([]);
    expect(parseSpecs('["texto suelto",{"label":"A","value":"B"}]')).toEqual([{ label: "A", value: "B" }]);
    expect(parseSpecs('[{"value":"sin etiqueta"}]')).toEqual([]);
    expect(parseSpecs('[{"label":"","value":"x"},{"label":"  ","value":"y"}]')).toEqual([]);
    expect(parseSpecs('[{"label":"Cupo","value":8}]')).toEqual([{ label: "Cupo", value: "8" }]);
    expect(parseSpecs('[{"label":"Nota"}]')).toEqual([{ label: "Nota", value: "" }]);
  });

  it("serializeSpecs drops empty labels and round-trips through parseSpecs", () => {
    expect(serializeSpecs([{ label: "Material", value: "Algodón" }])).toBe(
      '[{"label":"Material","value":"Algodón"}]'
    );
    expect(
      serializeSpecs([{ label: "", value: "x" }, { label: "  ", value: "y" }, { label: "Cupo", value: "" }])
    ).toBe('[{"label":"Cupo","value":""}]');
    expect(serializeSpecs([])).toBe("[]");
    expect(serializeSpecs(null)).toBe("[]");
    expect(serializeSpecs(undefined)).toBe("[]");
    expect(serializeSpecs("no un arreglo")).toBe("[]");

    const roundTrip = parseSpecs(serializeSpecs([{ label: "Duración", value: "4 horas" }]));
    expect(roundTrip).toEqual([{ label: "Duración", value: "4 horas" }]);
  });

  it("formatPrice renders dot-thousands currency labels without decimals", () => {
    expect(formatPrice("USD", null)).toBe("");
    expect(formatPrice("USD", undefined)).toBe("");
    expect(formatPrice("USD", 0)).toBe("USD 0");
    expect(formatPrice("USD", 8500)).toBe("USD 8.500");
    expect(formatPrice("COP", 120000)).toBe("COP 120.000");
    expect(formatPrice("EUR", 1000000)).toBe("EUR 1.000.000");
    expect(formatPrice("", 3200)).toBe("USD 3.200");
    expect(formatPrice(null, 45)).toBe("USD 45");
  });

  it("ENTREPRENEUR_CATEGORIES exposes the five catalog categories", () => {
    expect(ENTREPRENEUR_CATEGORIES.map((c) => c.value)).toEqual([
      "moda",
      "alimentos",
      "belleza",
      "editorial",
      "arte",
    ]);

    const moda = ENTREPRENEUR_CATEGORIES.find((c) => c.value === "moda");
    expect(moda?.es).toBe("Moda");
    expect(moda?.en).toBe("Fashion");

    const alimentos = ENTREPRENEUR_CATEGORIES.find((c) => c.value === "alimentos");
    expect(alimentos?.es).toBe("Alimentos");
    expect(alimentos?.en).toBe("Food");

    const belleza = ENTREPRENEUR_CATEGORIES.find((c) => c.value === "belleza");
    expect(belleza?.es).toBe("Belleza");
    expect(belleza?.en).toBe("Beauty");

    const editorial = ENTREPRENEUR_CATEGORIES.find((c) => c.value === "editorial");
    expect(editorial?.es).toBe("Editorial");
    expect(editorial?.en).toBe("Publishing");

    const arte = ENTREPRENEUR_CATEGORIES.find((c) => c.value === "arte");
    expect(arte?.es).toBe("Arte");
    expect(arte?.en).toBe("Art");
  });

  it("OFFERING_KINDS exposes products and services", () => {
    expect(OFFERING_KINDS.map((k) => k.value)).toEqual(["producto", "servicio"]);

    const producto = OFFERING_KINDS.find((k) => k.value === "producto");
    expect(producto?.es).toBe("Producto");
    expect(producto?.en).toBe("Product");

    const servicio = OFFERING_KINDS.find((k) => k.value === "servicio");
    expect(servicio?.es).toBe("Servicio");
    expect(servicio?.en).toBe("Service");
  });
});
