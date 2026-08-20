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

/**
 * Optimizes an image file in browser canvas (converting to WebP, scaling down to max 1920px, compressing)
 * and uploads it directly to Cloudflare R2 bucket under media/articles.
 */
async function optimizeAndUploadToR2(file: File, prefix = "articles"): Promise<string> {
  // If not image, upload directly
  if (!file.type.startsWith("image/")) {
    const formData = new FormData();
    formData.append("_intent", "upload");
    formData.append("file", file);
    formData.append("bucket", "media");
    formData.append("prefix", prefix);
    formData.append("customName", file.name);

    const res = await fetch("/api/admin/r2", { method: "POST", body: formData });
    const json = (await res.json()) as any;
    if (!json.ok || !json.streamUrl) {
      throw new Error(json.error || "Failed to upload file to R2");
    }
    return json.streamUrl;
  }

  // Create Image Bitmap for canvas optimization
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // Max bounds for inline article images (1920x1920 max)
  const maxBound = 1920;
  let targetW = origW;
  let targetH = origH;

  if (origW > maxBound || origH > maxBound) {
    if (origW > origH) {
      targetW = maxBound;
      targetH = Math.round(maxBound / (origW / origH));
    } else {
      targetH = maxBound;
      targetW = Math.round(maxBound * (origW / origH));
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context creation failed");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // Convert to high-performance WebP at 85% quality
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/webp", 0.85);
  });

  if (!blob) throw new Error("Image optimization failed");

  const cleanName = file.name.replace(/\.[^/.]+$/, "");
  const optimizedFile = new File([blob], `${cleanName}.webp`, { type: "image/webp" });

  const formData = new FormData();
  formData.append("_intent", "upload");
  formData.append("file", optimizedFile);
  formData.append("bucket", "media");
  formData.append("prefix", prefix);
  formData.append("customName", optimizedFile.name);

  const res = await fetch("/api/admin/r2", { method: "POST", body: formData });
  const json = (await res.json()) as any;
  if (!json.ok || !json.streamUrl) {
    throw new Error(json.error || "Failed to upload optimized image to R2");
  }

  return json.streamUrl;
}

/**
 * Proxies and optimizes an external image URL to Cloudflare R2 WebP format.
 */
async function optimizeAndUploadUrlToR2(url: string, prefix = "articles"): Promise<string> {
  const formData = new FormData();
  formData.append("_intent", "fetch_url");
  formData.append("sourceUrl", url);

  const res = await fetch("/api/admin/r2", { method: "POST", body: formData });
  const result = (await res.json()) as any;
  if (!result.ok || !result.dataUrl) {
    return url;
  }

  const blobRes = await fetch(result.dataUrl);
  const blob = await blobRes.blob();
  const file = new File([blob], result.fileName || "article-image.webp", { type: result.contentType });
  return await optimizeAndUploadToR2(file, prefix);
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
                async uploadByUrl(url: string) {
                  try {
                    const streamUrl = await optimizeAndUploadUrlToR2(url, "articles");
                    if (typeof window !== "undefined" && (window as any).AfroUpFeedback) {
                      (window as any).AfroUpFeedback.toast("Imagen optimizada y subida a R2.", "success");
                    }
                    return {
                      success: 1,
                      file: { url: streamUrl },
                    };
                  } catch (err: any) {
                    console.error("EditorJS image upload from URL error", err);
                    return {
                      success: 1,
                      file: { url },
                    };
                  }
                },
                async uploadByFile(file: File) {
                  try {
                    const streamUrl = await optimizeAndUploadToR2(file, "articles");
                    if (typeof window !== "undefined" && (window as any).AfroUpFeedback) {
                      (window as any).AfroUpFeedback.toast("Imagen optimizada a WebP y guardada en R2.", "success");
                    }
                    return {
                      success: 1,
                      file: { url: streamUrl },
                    };
                  } catch (err: any) {
                    console.error("EditorJS image upload error", err);
                    if (typeof window !== "undefined" && (window as any).AfroUpFeedback) {
                      (window as any).AfroUpFeedback.toast("Error al subir imagen a R2.", "error");
                    }
                    return { success: 0 };
                  }
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
