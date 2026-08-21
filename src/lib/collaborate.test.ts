import { describe, expect, test } from "bun:test";
import { validateCollaborateInput, slugifySkill } from "./collaborate";

describe("collaborate library helpers", () => {
  test("slugifySkill generates clean slugs", () => {
    expect(slugifySkill("Diseño & Ilustración")).toBe("diseno-ilustracion");
    expect(slugifySkill("Traducción (EN/PT)")).toBe("traduccion-en-pt");
    expect(slugifySkill("")).toBe("skill");
  });

  test("validateCollaborateInput validates valid input", () => {
    const res = validateCollaborateInput({
      name: "María Gómez",
      email: "maria@example.com",
      role: "Escritor/a",
      message: "Tengo experiencia en investigación histórica afrodescendiente.",
    });
    expect(res.valid).toBe(true);
    expect(Object.keys(res.errors).length).toBe(0);
  });

  test("validateCollaborateInput rejects short name or invalid email", () => {
    const res = validateCollaborateInput({
      name: "M",
      email: "invalid-email",
      role: "",
      message: "Corto",
    });
    expect(res.valid).toBe(false);
    expect(res.errors.name).toBeDefined();
    expect(res.errors.email).toBeDefined();
    expect(res.errors.role_wanted).toBeDefined();
    expect(res.errors.message).toBeDefined();
  });
});
