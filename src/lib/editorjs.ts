export interface EditorBlock {
  id?: string;
  type: string;
  data: Record<string, any>;
}

export interface EditorOutputData {
  time?: number;
  blocks: EditorBlock[];
  version?: string;
}

export function blocksToHtml(data: EditorOutputData | null | undefined): string {
  if (!data || !Array.isArray(data.blocks) || data.blocks.length === 0) {
    return "";
  }

  const htmlChunks: string[] = [];

  for (const block of data.blocks) {
    switch (block.type) {
      case "header": {
        const level = Number(block.data.level) || 2;
        const text = String(block.data.text || "").trim();
        if (text) {
          htmlChunks.push(`<h${level}>${text}</h${level}>`);
        }
        break;
      }
      case "paragraph": {
        const text = String(block.data.text || "").trim();
        if (text) {
          htmlChunks.push(`<p>${text}</p>`);
        }
        break;
      }
      case "quote": {
        const text = String(block.data.text || "").trim();
        const caption = String(block.data.caption || "").trim();
        if (text) {
          if (caption) {
            htmlChunks.push(`<div class="pull">“${text}”<figcaption>${caption}</figcaption></div>`);
          } else {
            htmlChunks.push(`<div class="pull">“${text}”</div>`);
          }
        }
        break;
      }
      case "list": {
        const style = block.data.style === "ordered" ? "ol" : "ul";
        const rawItems = Array.isArray(block.data.items) ? block.data.items : [];
        const items = rawItems
          .map((item: any) => {
            if (typeof item === "string") return item.trim();
            if (item && typeof item.content === "string") return item.content.trim();
            return "";
          })
          .filter(Boolean);

        if (items.length) {
          const listHtml = items.map((item: string) => `<li>${item}</li>`).join("");
          htmlChunks.push(`<${style}>${listHtml}</${style}>`);
        }
        break;
      }
      case "image": {
        const url = block.data.file?.url || block.data.url || "";
        const caption = String(block.data.caption || "").trim();
        if (url) {
          if (caption) {
            htmlChunks.push(
              `<figure class="figure"><img src="${url}" alt="${caption}" /><figcaption>${caption}</figcaption></figure>`,
            );
          } else {
            htmlChunks.push(`<figure class="figure"><img src="${url}" alt="" /></figure>`);
          }
        }
        break;
      }
      case "delimiter": {
        htmlChunks.push(`<hr />`);
        break;
      }
      case "table": {
        const withHeadings = Boolean(block.data.withHeadings);
        const rows = Array.isArray(block.data.content) ? block.data.content : [];
        if (rows.length) {
          let tableHtml = '<div class="overflow-x-auto my-6"><table class="table table-zebra w-full">';
          if (withHeadings && rows.length > 0) {
            tableHtml += "<thead><tr>";
            for (const cell of rows[0]) {
              tableHtml += `<th>${cell}</th>`;
            }
            tableHtml += "</tr></thead><tbody>";
            for (let i = 1; i < rows.length; i++) {
              tableHtml += "<tr>";
              for (const cell of rows[i]) {
                tableHtml += `<td>${cell}</td>`;
              }
              tableHtml += "</tr>";
            }
            tableHtml += "</tbody>";
          } else {
            tableHtml += "<tbody>";
            for (const row of rows) {
              tableHtml += "<tr>";
              for (const cell of row) {
                tableHtml += `<td>${cell}</td>`;
              }
              tableHtml += "</tr>";
            }
            tableHtml += "</tbody>";
          }
          tableHtml += "</table></div>";
          htmlChunks.push(tableHtml);
        }
        break;
      }
      case "embed": {
        const embed = block.data.embed || "";
        const caption = String(block.data.caption || "").trim();
        if (embed) {
          htmlChunks.push(
            `<div class="aspect-video w-full my-6"><iframe src="${embed}" class="size-full rounded-xl" frameborder="0" allowfullscreen></iframe></div>`,
          );
          if (caption) {
            htmlChunks.push(`<p class="text-xs text-center opacity-70 mt-1">${caption}</p>`);
          }
        }
        break;
      }
      case "raw": {
        const html = String(block.data.html || "").trim();
        if (html) htmlChunks.push(html);
        break;
      }
      default: {
        if (block.data && typeof block.data.text === "string") {
          htmlChunks.push(`<p>${block.data.text}</p>`);
        }
        break;
      }
    }
  }

  return htmlChunks.join("\n\n");
}

export function htmlToBlocks(html: string | null | undefined): EditorOutputData {
  if (!html || typeof html !== "string") {
    return { time: Date.now(), blocks: [] };
  }

  const trimmed = html.trim();
  if (!trimmed) {
    return { time: Date.now(), blocks: [] };
  }

  // Check if it's already serialized JSON
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && Array.isArray(parsed.blocks)) {
        return parsed;
      }
    } catch {
      // Not JSON, continue to HTML parsing
    }
  }

  // If in browser or DOM environment:
  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, "text/html");
    const elements = Array.from(doc.body.children);
    const blocks: EditorBlock[] = [];

    // If body has no element children (e.g. raw text), create a paragraph
    if (elements.length === 0 && doc.body.textContent?.trim()) {
      blocks.push({
        type: "paragraph",
        data: { text: doc.body.innerHTML.trim() },
      });
      return { time: Date.now(), blocks };
    }

    for (const el of elements) {
      const tag = el.tagName.toUpperCase();

      if (tag === "H1" || tag === "H2") {
        blocks.push({
          type: "header",
          data: { text: el.innerHTML.trim(), level: 2 },
        });
      } else if (tag === "H3" || tag === "H4" || tag === "H5" || tag === "H6") {
        blocks.push({
          type: "header",
          data: { text: el.innerHTML.trim(), level: 3 },
        });
      } else if (tag === "P") {
        const text = el.innerHTML.trim();
        if (text) {
          blocks.push({
            type: "paragraph",
            data: { text },
          });
        }
      } else if (tag === "BLOCKQUOTE" || el.classList.contains("pull")) {
        const captionEl = el.querySelector("figcaption");
        const caption = captionEl ? captionEl.innerHTML.trim() : "";
        let text = el.innerHTML;
        if (captionEl) {
          captionEl.remove();
          text = el.innerHTML;
        }
        text = text.replace(/^[“"']|[”"']$/g, "").trim();
        blocks.push({
          type: "quote",
          data: { text, caption },
        });
      } else if (tag === "UL" || tag === "OL") {
        const items = Array.from(el.querySelectorAll(":scope > li")).map((li) => li.innerHTML.trim());
        blocks.push({
          type: "list",
          data: {
            style: tag === "OL" ? "ordered" : "unordered",
            items,
          },
        });
      } else if (tag === "FIGURE" || tag === "IMG") {
        const img = tag === "IMG" ? (el as HTMLImageElement) : el.querySelector("img");
        const figcaption = el.querySelector("figcaption");
        if (img && img.getAttribute("src")) {
          blocks.push({
            type: "image",
            data: {
              file: { url: img.getAttribute("src") },
              caption: figcaption ? figcaption.innerHTML.trim() : img.getAttribute("alt") || "",
            },
          });
        }
      } else if (tag === "HR") {
        blocks.push({
          type: "delimiter",
          data: {},
        });
      } else if (tag === "TABLE") {
        const rows: string[][] = [];
        el.querySelectorAll("tr").forEach((tr) => {
          const rowCells: string[] = [];
          tr.querySelectorAll("th, td").forEach((cell) => {
            rowCells.push(cell.innerHTML.trim());
          });
          if (rowCells.length) rows.push(rowCells);
        });
        const hasHeader = Boolean(el.querySelector("thead th"));
        blocks.push({
          type: "table",
          data: {
            withHeadings: hasHeader,
            content: rows,
          },
        });
      } else {
        // Fallback for custom div or containers
        const text = el.innerHTML.trim();
        if (text) {
          blocks.push({
            type: "paragraph",
            data: { text },
          });
        }
      }
    }

    return { time: Date.now(), blocks };
  }

  // Fallback
  return {
    time: Date.now(),
    blocks: [
      {
        type: "paragraph",
        data: { text: trimmed },
      },
    ],
  };
}
