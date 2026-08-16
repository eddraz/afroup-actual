import { describe, expect, test } from "bun:test";
import { isBlankBio, plannedBioWrites } from "./bio-writes";

const existing = {
  es: "Hola desde AfroUp",
  en: "Hello from AfroUp",
};

describe("isBlankBio", () => {
  test("treats empty markup as blank", () => {
    expect(isBlankBio("")).toBe(true);
    expect(isBlankBio("   ")).toBe(true);
    expect(isBlankBio("<p><br></p>")).toBe(true);
    expect(isBlankBio("<p>&nbsp;</p>")).toBe(true);
  });

  test("keeps real text", () => {
    expect(isBlankBio("Hola")).toBe(false);
    expect(isBlankBio("<p>Hello from AfroUp</p>")).toBe(false);
  });
});

describe("plannedBioWrites", () => {
  test("without translation permissions only updates the primary bio", () => {
    expect(
      plannedBioWrites(
        { es: "Nuevo texto", en: "Should not persist" },
        existing,
        { canWrite: false, canUseAi: false },
      ),
    ).toEqual({
      es: "Nuevo texto",
      en: "Hello from AfroUp",
    });
  });

  test("manual write persists typed translations and can clear them", () => {
    expect(
      plannedBioWrites(
        { es: "Hola", en: "Hello there" },
        existing,
        { canWrite: true, canUseAi: false },
      ),
    ).toEqual({
      es: "Hola",
      en: "Hello there",
    });

    expect(
      plannedBioWrites({ es: "Hola", en: "<p></p>" }, existing, {
        canWrite: true,
        canUseAi: false,
      }),
    ).toEqual({
      es: "Hola",
    });
  });

  test("AI-only persists applied translations without wiping siblings", () => {
    expect(
      plannedBioWrites(
        { es: "Hola desde AfroUp", en: "Hello from AfroUp, improved" },
        existing,
        { canWrite: false, canUseAi: true },
      ),
    ).toEqual({
      es: "Hola desde AfroUp",
      en: "Hello from AfroUp, improved",
    });
  });

  test("AI-only keeps an existing translation when the submitted field is empty", () => {
    expect(
      plannedBioWrites({ es: "Hola desde AfroUp", en: "" }, existing, {
        canWrite: false,
        canUseAi: true,
      }),
    ).toEqual({
      es: "Hola desde AfroUp",
      en: "Hello from AfroUp",
    });
  });
});
