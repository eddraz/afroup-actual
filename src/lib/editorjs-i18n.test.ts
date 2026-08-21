import { describe, expect, test } from "bun:test";
import {
  EDITORJS_I18N_KEYS,
  editorJsConfigFromCopy,
  pickEditorJsCopy,
  resolveEditorCopy,
} from "./editorjs-i18n";

describe("editorjs-i18n", () => {
  test("pickEditorJsCopy keeps only editorjs keys", () => {
    const picked = pickEditorJsCopy({
      editorjsPlaceholder: "Escribe aquí...",
      titleHome: "AfroUp — Inicio",
    });
    expect(picked.editorjsPlaceholder).toBe("Escribe aquí...");
    expect(picked.titleHome).toBeUndefined();
  });

  test("editorJsConfigFromCopy falls back to Spanish and maps Editor.js messages", () => {
    const config = editorJsConfigFromCopy({});
    expect(config.placeholder).toContain("bloques");
    expect(config.messages.toolNames?.Text).toBe("Texto");
    expect(config.messages.ui?.toolbar).toBeDefined();
    expect((config.messages.ui as { popover?: { Filter?: string } })?.popover?.Filter).toBe("Filtrar");
    expect(config.direction).toBe("ltr");
  });

  test("English copy produces English Editor.js chrome", () => {
    const copy = Object.fromEntries(EDITORJS_I18N_KEYS.map((key) => [key, `EN-${key}`]));
    copy.editorjsPlaceholder = "Write the article in blocks...";
    copy.editorjsToolText = "Text";
    const config = editorJsConfigFromCopy(copy);
    expect(config.placeholder).toBe("Write the article in blocks...");
    expect(config.messages.toolNames?.Text).toBe("Text");
  });

  test("Arabic locale uses rtl direction", () => {
    expect(editorJsConfigFromCopy({}, "ar").direction).toBe("rtl");
    expect(editorJsConfigFromCopy({}, "es").direction).toBe("ltr");
  });

  test("resolveEditorCopy uses bundled es/en and merges stored dictionaries", () => {
    const bundled = {
      es: { editorjsPlaceholder: "ES" },
      en: { editorjsPlaceholder: "EN" },
    };
    expect(resolveEditorCopy("es", bundled, { editorjsPlaceholder: "ignored" }).editorjsPlaceholder).toBe("ES");
    expect(resolveEditorCopy("en", bundled, null).editorjsPlaceholder).toBe("EN");
    expect(resolveEditorCopy("fr", bundled, { editorjsPlaceholder: "FR" }).editorjsPlaceholder).toBe("FR");
    expect(resolveEditorCopy("fr", bundled, null).editorjsPlaceholder).toBe("ES");
  });
});
