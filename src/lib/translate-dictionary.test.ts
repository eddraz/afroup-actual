import { describe, expect, test } from "bun:test";
import { buildPlainTextTranslationMessages } from "./translate-plain-text";

describe("buildPlainTextTranslationMessages", () => {
  test("translates from the original when the target is empty", () => {
    const messages = buildPlainTextTranslationMessages({
      sourceText: "Hola desde AfroUp",
      sourceName: "Spanish",
      targetCode: "en",
      targetName: "English",
    });

    expect(messages[0]?.content).toContain("Return only the translated text");
    expect(messages[1]?.content).toContain("Hola desde AfroUp");
    expect(messages[1]?.content).not.toContain("Improve");
  });

  test("improves the current locale draft using the original as source of truth", () => {
    const messages = buildPlainTextTranslationMessages({
      sourceText: "Hola desde AfroUp",
      sourceName: "Spanish",
      targetCode: "en",
      targetName: "English",
      currentText: "Hi from AfroUp",
    });

    expect(messages[0]?.content).toContain("Improve");
    expect(messages[1]?.content).toContain("Hola desde AfroUp");
    expect(messages[1]?.content).toContain("Hi from AfroUp");
  });
});
