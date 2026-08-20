import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import ImageTool from "@editorjs/image";
import Delimiter from "@editorjs/delimiter";
import Table from "@editorjs/table";
import Embed from "@editorjs/embed";
import { blocksToHtml, htmlToBlocks, type EditorOutputData } from "./editorjs";

declare global {
  interface Window {
    __afroupEditors?: Record<string, EditorJS>;
  }
}

export function destroyArticleEditors(): void {
  if (typeof window !== "undefined" && window.__afroupEditors) {
    for (const editor of Object.values(window.__afroupEditors)) {
      try {
        if (typeof editor.destroy === "function") {
          editor.destroy();
        }
      } catch {}
    }
    window.__afroupEditors = {};
  }
}

export function initArticleEditors(): Record<string, EditorJS> {
  if (typeof window === "undefined") return {};

  if (!window.__afroupEditors) {
    window.__afroupEditors = {};
  }

  const holders = document.querySelectorAll<HTMLElement>("[data-editorjs-locale]");

  holders.forEach((holder) => {
    const locale = holder.dataset.editorjsLocale;
    if (!locale) return;

    // Prevent double initialization if already active on this element
    if (holder.dataset.editorInit === "true" && window.__afroupEditors?.[locale]) {
      return;
    }

    holder.dataset.editorInit = "true";
    holder.innerHTML = "";

    const textarea = document.querySelector<HTMLTextAreaElement>(`[data-content-input='${locale}']`);
    const initialHtml = textarea?.value || "";
    const initialData: EditorOutputData = htmlToBlocks(initialHtml);

    try {
      const editor = new EditorJS({
        holder: holder.id,
        placeholder: "Escribe aquí el contenido del artículo usando bloques (presiona Tab o clic en +)...",
        data: initialData.blocks.length ? initialData : undefined,
        tools: {
          header: {
            class: Header as any,
            inlineToolbar: ["link", "bold", "italic"],
            config: {
              placeholder: "Encabezado...",
              levels: [2, 3, 4],
              defaultLevel: 2,
            },
          },
          list: {
            class: List as any,
            inlineToolbar: true,
            config: {
              defaultStyle: "unordered",
            },
          },
          quote: {
            class: Quote as any,
            inlineToolbar: true,
            config: {
              quotePlaceholder: "Cita destacada...",
              captionPlaceholder: "Autor o pie de cita...",
            },
          },
          image: {
            class: ImageTool as any,
            config: {
              uploader: {
                uploadByUrl(url: string) {
                  return Promise.resolve({
                    success: 1,
                    file: { url },
                  });
                },
                uploadByFile(file: File) {
                  return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      resolve({
                        success: 1,
                        file: { url: e.target?.result as string },
                      });
                    };
                    reader.readAsDataURL(file);
                  });
                },
              },
            },
          },
          delimiter: Delimiter as any,
          table: {
            class: Table as any,
            inlineToolbar: true,
            config: {
              rows: 2,
              cols: 3,
            },
          },
          embed: {
            class: Embed as any,
            config: {
              services: {
                youtube: true,
                vimeo: true,
                twitter: true,
                instagram: true,
              },
            },
          },
        },
        onChange: async () => {
          try {
            const output = await editor.save();
            const html = blocksToHtml(output);
            if (textarea) {
              textarea.value = html;
            }
          } catch {}
        },
      });

      window.__afroupEditors[locale] = editor;
    } catch (err) {
      console.error("Failed to initialize EditorJS for locale", locale, err);
    }
  });

  return window.__afroupEditors;
}

export { blocksToHtml, htmlToBlocks };
