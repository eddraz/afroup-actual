import { describe, expect, it } from "bun:test";
import {
  PROJECT_STAGES,
  formatBudget,
  slugifyProject,
} from "./projects";

describe("projects library helpers", () => {
  it("slugifyProject generates clean URL slugs", () => {
    expect(slugifyProject("Archivo oral afrocolombiano")).toBe("archivo-oral-afrocolombiano");
    expect(slugifyProject("Podcast Saberes del Pacífico")).toBe("podcast-saberes-del-pacifico");
    expect(slugifyProject("Atlas Afrolatinoamericano")).toBe("atlas-afrolatinoamericano");
    expect(slugifyProject("Memoria viva: rutas del cimarronaje")).toBe("memoria-viva-rutas-del-cimarronaje");
    expect(slugifyProject("  Escuela   de verano  ")).toBe("escuela-de-verano");
    expect(slugifyProject("")).toBe("proyecto");
  });

  it("formatBudget renders dot-thousands currency labels without decimals", () => {
    expect(formatBudget("USD", null)).toBe("");
    expect(formatBudget("USD", undefined)).toBe("");
    expect(formatBudget("USD", 0)).toBe("USD 0");
    expect(formatBudget("USD", 8500)).toBe("USD 8.500");
    expect(formatBudget("COP", 12000)).toBe("COP 12.000");
    expect(formatBudget("EUR", 1000000)).toBe("EUR 1.000.000");
    expect(formatBudget("USD", 1234.56)).toBe("USD 1.234");
    expect(formatBudget("", 3200)).toBe("USD 3.200");
  });

  it("PROJECT_STAGES exposes the three workflow stages", () => {
    expect(PROJECT_STAGES.map((s) => s.value)).toEqual(["borrador", "en_revision", "aprobado"]);

    const borrador = PROJECT_STAGES.find((s) => s.value === "borrador");
    expect(borrador?.es).toBe("Borrador");
    expect(borrador?.en).toBe("Draft");

    const enRevision = PROJECT_STAGES.find((s) => s.value === "en_revision");
    expect(enRevision?.es).toBe("En revisión");
    expect(enRevision?.en).toBe("In review");

    const aprobado = PROJECT_STAGES.find((s) => s.value === "aprobado");
    expect(aprobado?.es).toBe("Aprobado");
    expect(aprobado?.en).toBe("Approved");
  });
});
