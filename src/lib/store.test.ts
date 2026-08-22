import { describe, expect, it } from "bun:test";
import {
  STORE_CATEGORIES,
  formatStorePrice,
  parseStoreSpecs,
  serializeStoreSpecs,
  slugifyStoreProduct,
} from "./store";

describe("store library helpers", () => {
  it("slugifyStoreProduct generates clean URL slugs", () => {
    expect(slugifyStoreProduct("Raíces: historia afro de Abya Yala")).toBe(
      "raices-historia-afro-de-abya-yala"
    );
    expect(slugifyStoreProduct("Camiseta “Conocimiento = poder”")).toBe(
      "camiseta-conocimiento-poder"
    );
    expect(slugifyStoreProduct("Lámina · Reina Nzinga")).toBe("lamina-reina-nzinga");
    expect(slugifyStoreProduct("  Set de stickers Palenque  ")).toBe("set-de-stickers-palenque");
    expect(slugifyStoreProduct("")).toBe("producto");
    expect(slugifyStoreProduct("///")).toBe("producto");
  });

  it("formatStorePrice renders dot-thousands currency labels without decimals", () => {
    expect(formatStorePrice("USD", null)).toBe("");
    expect(formatStorePrice("USD", undefined)).toBe("");
    expect(formatStorePrice("USD", 0)).toBe("USD 0");
    expect(formatStorePrice("USD", 12)).toBe("USD 12");
    expect(formatStorePrice("COP", 22000)).toBe("COP 22.000");
    expect(formatStorePrice("EUR", 1000000)).toBe("EUR 1.000.000");
    expect(formatStorePrice("USD", 18.9)).toBe("USD 18");
    expect(formatStorePrice("", 22)).toBe("USD 22");
  });

  it("STORE_CATEGORIES exposes the four catalog categories", () => {
    expect(STORE_CATEGORIES.map((c) => c.value)).toEqual(["ebook", "lamina", "merch", "descargable"]);

    const ebook = STORE_CATEGORIES.find((c) => c.value === "ebook");
    expect(ebook?.es).toBe("eBook");
    expect(ebook?.en).toBe("eBook");

    const lamina = STORE_CATEGORIES.find((c) => c.value === "lamina");
    expect(lamina?.es).toBe("Lámina");
    expect(lamina?.en).toBe("Print");

    const merch = STORE_CATEGORIES.find((c) => c.value === "merch");
    expect(merch?.es).toBe("Merch");
    expect(merch?.en).toBe("Merch");

    const descargable = STORE_CATEGORIES.find((c) => c.value === "descargable");
    expect(descargable?.es).toBe("Descargable");
    expect(descargable?.en).toBe("Downloadable");
  });

  it("parseStoreSpecs normalizes technical sheet entries and tolerates invalid JSON", () => {
    expect(parseStoreSpecs(null)).toEqual([]);
    expect(parseStoreSpecs(undefined)).toEqual([]);
    expect(parseStoreSpecs("")).toEqual([]);
    expect(parseStoreSpecs("not json")).toEqual([]);
    expect(parseStoreSpecs('{"label":"Material"}')).toEqual([]);

    expect(
      parseStoreSpecs(
        '[{"label":"Material","value":"Algodón"},{"label":"","value":"x"},{"label":"Talla","value":null}]'
      )
    ).toEqual([
      { label: "Material", value: "Algodón" },
      { label: "Talla", value: "" },
    ]);
  });

  it("serializeStoreSpecs round-trips through parseStoreSpecs and drops invalid entries", () => {
    const input = [
      { label: "Material", value: "Algodón orgánico" },
      { label: "", value: "dropped" },
      { label: "Dimensiones", value: 30 },
      null,
      "nope",
    ];

    const serialized = serializeStoreSpecs(input);
    expect(JSON.parse(serialized)).toEqual([
      { label: "Material", value: "Algodón orgánico" },
      { label: "Dimensiones", value: "30" },
    ]);

    expect(serializeStoreSpecs("not an array")).toBe("[]");
    expect(serializeStoreSpecs(undefined)).toBe("[]");
    expect(parseStoreSpecs(serialized)).toEqual(JSON.parse(serialized));
  });
});
