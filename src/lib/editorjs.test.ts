import { describe, expect, test } from "bun:test";
import { blocksToHtml, htmlToBlocks } from "./editorjs";

describe("blocksToHtml", () => {
  test("returns empty string for null or empty blocks", () => {
    expect(blocksToHtml(null)).toBe("");
    expect(blocksToHtml({ blocks: [] })).toBe("");
  });

  test("converts header blocks correctly", () => {
    const data = {
      blocks: [
        { type: "header", data: { text: "Título principal", level: 2 } },
        { type: "header", data: { text: "Subtítulo", level: 3 } },
      ],
    };
    expect(blocksToHtml(data)).toBe("<h2>Título principal</h2>\n\n<h3>Subtítulo</h3>");
  });

  test("converts paragraphs and quotes correctly", () => {
    const data = {
      blocks: [
        { type: "paragraph", data: { text: "Texto con <strong>negrita</strong>." } },
        { type: "quote", data: { text: "Cita destacada", caption: "Autor" } },
      ],
    };
    expect(blocksToHtml(data)).toBe(
      '<p>Texto con <strong>negrita</strong>.</p>\n\n<div class="pull">“Cita destacada”<figcaption>Autor</figcaption></div>',
    );
  });

  test("converts lists correctly", () => {
    const unordered = {
      blocks: [
        { type: "list", data: { style: "unordered", items: ["Uno", "Dos"] } },
      ],
    };
    expect(blocksToHtml(unordered)).toBe("<ul><li>Uno</li><li>Dos</li></ul>");

    const ordered = {
      blocks: [
        { type: "list", data: { style: "ordered", items: ["Primero", "Segundo"] } },
      ],
    };
    expect(blocksToHtml(ordered)).toBe("<ol><li>Primero</li><li>Segundo</li></ol>");
  });

  test("converts image figures correctly", () => {
    const data = {
      blocks: [
        {
          type: "image",
          data: {
            file: { url: "https://example.com/photo.jpg" },
            caption: "Descripción",
          },
        },
      ],
    };
    expect(blocksToHtml(data)).toBe(
      '<figure class="figure"><img src="https://example.com/photo.jpg" alt="Descripción" /><figcaption>Descripción</figcaption></figure>',
    );
  });

  test("converts delimiter correctly", () => {
    const data = {
      blocks: [{ type: "delimiter", data: {} }],
    };
    expect(blocksToHtml(data)).toBe("<hr />");
  });
});

describe("htmlToBlocks", () => {
  test("returns empty blocks for null or empty html", () => {
    expect(htmlToBlocks("").blocks).toEqual([]);
    expect(htmlToBlocks(null).blocks).toEqual([]);
  });

  test("parses JSON string directly if already formatted as blocks", () => {
    const json = JSON.stringify({
      time: 123,
      blocks: [{ type: "paragraph", data: { text: "Hola" } }],
    });
    expect(htmlToBlocks(json).blocks).toEqual([
      { type: "paragraph", data: { text: "Hola" } },
    ]);
  });
});
