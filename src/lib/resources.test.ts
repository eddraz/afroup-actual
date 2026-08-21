import { describe, expect, test } from "bun:test";
import { slugifyResource } from "./resources";

describe("resources library helpers", () => {
  test("slugifyResource generates clean URL slugs", () => {
    expect(slugifyResource("Guía docente: cimarronaje en el aula")).toBe("guia-docente-cimarronaje-en-el-aula");
    expect(slugifyResource("50 Lecturas Fundamentales & Críticas!")).toBe("50-lecturas-fundamentales-criticas");
    expect(slugifyResource("   ¿Quiénes Somos?   ")).toBe("quienes-somos");
    expect(slugifyResource("")).toBe("recurso");
  });
});
