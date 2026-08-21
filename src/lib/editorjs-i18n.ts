import type { I18nDictionary } from "@editorjs/editorjs";

export const EDITORJS_RTL_LOCALES = new Set(["ar", "fa", "he", "ur"]);

export const EDITORJS_I18N_KEYS = [
  "editorjsPlaceholder",
  "editorjsHeaderPlaceholder",
  "editorjsQuotePlaceholder",
  "editorjsCaptionPlaceholder",
  "editorjsUiClickToTune",
  "editorjsUiOrDragToMove",
  "editorjsUiConvertTo",
  "editorjsUiAdd",
  "editorjsUiFilter",
  "editorjsUiNothingFound",
  "editorjsToolText",
  "editorjsToolHeading",
  "editorjsToolList",
  "editorjsToolQuote",
  "editorjsToolImage",
  "editorjsToolDelimiter",
  "editorjsToolTable",
  "editorjsToolEmbed",
  "editorjsToolCarousel",
  "editorjsToolVideo",
  "editorjsToolLink",
  "editorjsToolBold",
  "editorjsToolItalic",
  "editorjsLinkAdd",
  "editorjsStub",
  "editorjsTuneDelete",
  "editorjsTuneClickToDelete",
  "editorjsTuneMoveUp",
  "editorjsTuneMoveDown",
  "editorjsImageCaption",
  "editorjsSlideCaption",
  "editorjsCarouselCaption",
  "editorjsVideoCaption",
  "editorjsUploadImages",
  "editorjsAddUrl",
] as const;

export type EditorJsI18nKey = (typeof EDITORJS_I18N_KEYS)[number];

const SPANISH_FALLBACK: Record<EditorJsI18nKey, string> = {
  editorjsPlaceholder: "Escribe aquí el contenido del artículo usando bloques (presiona Tab o clic en +)...",
  editorjsHeaderPlaceholder: "Encabezado...",
  editorjsQuotePlaceholder: "Cita destacada...",
  editorjsCaptionPlaceholder: "Autor o pie de cita...",
  editorjsUiClickToTune: "Haz clic para ajustar",
  editorjsUiOrDragToMove: "o arrastra para mover",
  editorjsUiConvertTo: "Convertir a",
  editorjsUiAdd: "Añadir",
  editorjsUiFilter: "Filtrar",
  editorjsUiNothingFound: "Sin resultados",
  editorjsToolText: "Texto",
  editorjsToolHeading: "Encabezado",
  editorjsToolList: "Lista",
  editorjsToolQuote: "Cita",
  editorjsToolImage: "Imagen",
  editorjsToolDelimiter: "Separador",
  editorjsToolTable: "Tabla",
  editorjsToolEmbed: "Embed",
  editorjsToolCarousel: "Carrusel de imágenes",
  editorjsToolVideo: "Reproductor de video",
  editorjsToolLink: "Enlace",
  editorjsToolBold: "Negrita",
  editorjsToolItalic: "Cursiva",
  editorjsLinkAdd: "Añadir un enlace",
  editorjsStub: "Este bloque no se puede mostrar correctamente.",
  editorjsTuneDelete: "Eliminar",
  editorjsTuneClickToDelete: "Haz clic para eliminar",
  editorjsTuneMoveUp: "Subir",
  editorjsTuneMoveDown: "Bajar",
  editorjsImageCaption: "Pie de foto",
  editorjsSlideCaption: "Pie de foto (opcional)...",
  editorjsCarouselCaption: "Pie de título general del carrusel (opcional)...",
  editorjsVideoCaption: "Pie de video / descripción (opcional)...",
  editorjsUploadImages: "Subir imágenes",
  editorjsAddUrl: "Agregar URL",
};

function text(copy: Record<string, string>, key: EditorJsI18nKey): string {
  const value = copy[key];
  return typeof value === "string" && value.trim() ? value : SPANISH_FALLBACK[key];
}

export function pickEditorJsCopy(copy: Record<string, string>): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const key of EDITORJS_I18N_KEYS) {
    if (typeof copy[key] === "string") picked[key] = copy[key];
  }
  return picked;
}

export function resolveEditorCopy(
  code: string,
  bundled: { es: Record<string, string>; en: Record<string, string> },
  stored: Record<string, string> | null,
): Record<string, string> {
  if (code === "es") return bundled.es;
  if (code === "en") return bundled.en;
  return { ...bundled.es, ...(stored ?? {}) };
}

export function editorJsConfigFromCopy(
  copy: Record<string, string>,
  locale = "es",
): {
  placeholder: string;
  headerPlaceholder: string;
  quotePlaceholder: string;
  captionPlaceholder: string;
  imageCaption: string;
  slideCaption: string;
  carouselCaption: string;
  videoCaption: string;
  uploadImages: string;
  addUrl: string;
  direction: "ltr" | "rtl";
  messages: I18nDictionary;
} {
  return {
    placeholder: text(copy, "editorjsPlaceholder"),
    headerPlaceholder: text(copy, "editorjsHeaderPlaceholder"),
    quotePlaceholder: text(copy, "editorjsQuotePlaceholder"),
    captionPlaceholder: text(copy, "editorjsCaptionPlaceholder"),
    imageCaption: text(copy, "editorjsImageCaption"),
    slideCaption: text(copy, "editorjsSlideCaption"),
    carouselCaption: text(copy, "editorjsCarouselCaption"),
    videoCaption: text(copy, "editorjsVideoCaption"),
    uploadImages: text(copy, "editorjsUploadImages"),
    addUrl: text(copy, "editorjsAddUrl"),
    direction: EDITORJS_RTL_LOCALES.has(locale) ? "rtl" : "ltr",
    messages: {
      ui: {
        blockTunes: {
          toggler: {
            "Click to tune": text(copy, "editorjsUiClickToTune"),
            "or drag to move": text(copy, "editorjsUiOrDragToMove"),
          },
        },
        inlineToolbar: {
          converter: {
            "Convert to": text(copy, "editorjsUiConvertTo"),
          },
        },
        toolbar: {
          toolbox: {
            Add: text(copy, "editorjsUiAdd"),
          },
        },
        popover: {
          Filter: text(copy, "editorjsUiFilter"),
          "Nothing found": text(copy, "editorjsUiNothingFound"),
          "Convert to": text(copy, "editorjsUiConvertTo"),
        },
      },
      toolNames: {
        Text: text(copy, "editorjsToolText"),
        Heading: text(copy, "editorjsToolHeading"),
        List: text(copy, "editorjsToolList"),
        Quote: text(copy, "editorjsToolQuote"),
        Image: text(copy, "editorjsToolImage"),
        Delimiter: text(copy, "editorjsToolDelimiter"),
        Table: text(copy, "editorjsToolTable"),
        Embed: text(copy, "editorjsToolEmbed"),
        "Image carousel": text(copy, "editorjsToolCarousel"),
        "Video player": text(copy, "editorjsToolVideo"),
        Link: text(copy, "editorjsToolLink"),
        Bold: text(copy, "editorjsToolBold"),
        Italic: text(copy, "editorjsToolItalic"),
      },
      tools: {
        link: {
          "Add a link": text(copy, "editorjsLinkAdd"),
        },
        stub: {
          "The block can not be displayed correctly.": text(copy, "editorjsStub"),
        },
      },
      blockTunes: {
        delete: {
          Delete: text(copy, "editorjsTuneDelete"),
          "Click to delete": text(copy, "editorjsTuneClickToDelete"),
        },
        moveUp: {
          "Move up": text(copy, "editorjsTuneMoveUp"),
        },
        moveDown: {
          "Move down": text(copy, "editorjsTuneMoveDown"),
        },
      },
    },
  };
}
