export interface R2BucketDefinition {
  id: string;
  bindingName: string;
  bucketName: string;
  label: string;
  description: string;
  icon: string;
  badge: string;
  allowedTypes?: string[];
}

export interface R2ItemSummary {
  key: string;
  name: string;
  path: string;
  size: number;
  formattedSize: string;
  uploaded: string;
  formattedDate: string;
  etag: string;
  httpEtag: string;
  contentType: string;
  isImage: boolean;
  isPdf: boolean;
  isAudio: boolean;
  isVideo: boolean;
  isCode: boolean;
  category: "image" | "pdf" | "audio" | "video" | "code" | "archive" | "document" | "other";
  streamUrl: string;
  customMetadata?: Record<string, string>;
}

export const KNOWN_BUCKETS: R2BucketDefinition[] = [
  {
    id: "avatars",
    bindingName: "AVATARS",
    bucketName: "afroup-avatars",
    label: "Avatares de Usuario",
    description: "Fotos de perfil y retratos de colaboradores y usuarios registrados.",
    icon: "ic-users",
    badge: "Perfil & Cuentas",
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  },
  {
    id: "media",
    bindingName: "MEDIA",
    bucketName: "afroup-media",
    label: "Multimedia & Artículos",
    description: "Imágenes de portada, ilustraciones editoriales y recursos visuales.",
    icon: "ic-book2",
    badge: "Editorial & Prensa",
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "video/mp4", "audio/mpeg"],
  },
  {
    id: "documents",
    bindingName: "DOCUMENTS",
    bucketName: "afroup-documents",
    label: "Documentos & Guías",
    description: "Archivos PDF, investigaciones etno-educativas y material descargable.",
    icon: "ic-stack",
    badge: "Biblioteca & PDF",
    allowedTypes: ["application/pdf", "application/zip", "text/plain", "text/markdown", "application/json"],
  },
];

export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

export function getFileCategory(contentType = "", fileName = ""): R2ItemSummary["category"] {
  const lowerType = contentType.toLowerCase();
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (lowerType.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "svg", "avif"].includes(ext)) {
    return "image";
  }
  if (lowerType.includes("pdf") || ext === "pdf") {
    return "pdf";
  }
  if (lowerType.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "flac"].includes(ext)) {
    return "audio";
  }
  if (lowerType.startsWith("video/") || ["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) {
    return "video";
  }
  if (
    lowerType.includes("javascript") ||
    lowerType.includes("typescript") ||
    lowerType.includes("json") ||
    lowerType.includes("html") ||
    lowerType.includes("css") ||
    ["js", "ts", "json", "html", "css", "sql", "sh", "py"].includes(ext)
  ) {
    return "code";
  }
  if (lowerType.includes("zip") || lowerType.includes("tar") || lowerType.includes("compressed") || ["zip", "gz", "tar", "rar", "7z"].includes(ext)) {
    return "archive";
  }
  if (lowerType.includes("text/") || ["txt", "md", "csv", "doc", "docx"].includes(ext)) {
    return "document";
  }
  return "other";
}

export function resolveR2Bucket(envObj: Record<string, unknown>, bucketId: string): { bucket: any; definition: R2BucketDefinition } | null {
  const def = KNOWN_BUCKETS.find((b) => b.id.toLowerCase() === bucketId.toLowerCase() || b.bucketName.toLowerCase() === bucketId.toLowerCase() || b.bindingName.toLowerCase() === bucketId.toLowerCase());
  if (!def) return null;

  const bucketInstance = envObj[def.bindingName] || envObj[def.id] || envObj[def.bucketName];
  if (!bucketInstance || typeof (bucketInstance as any).list !== "function") {
    return null;
  }

  return { bucket: bucketInstance, definition: def };
}

export function formatR2Date(date: Date | string | null | undefined, locale = "es"): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale.startsWith("en") ? "en-US" : "es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(date);
  }
}

export function mapR2Object(obj: any, bucketId: string, locale = "es"): R2ItemSummary {
  const key: string = obj.key || "";
  const parts = key.split("/");
  const name = parts[parts.length - 1] || key;
  const path = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
  const size: number = obj.size || 0;
  const uploadedDate = obj.uploaded ? (typeof obj.uploaded === "string" ? new Date(obj.uploaded) : obj.uploaded) : new Date();
  const contentType: string = obj.httpMetadata?.contentType || "application/octet-stream";
  const category = getFileCategory(contentType, name);

  return {
    key,
    name,
    path,
    size,
    formattedSize: formatBytes(size),
    uploaded: uploadedDate.toISOString(),
    formattedDate: formatR2Date(uploadedDate, locale),
    etag: obj.etag || "",
    httpEtag: obj.httpEtag || obj.etag || "",
    contentType,
    isImage: category === "image",
    isPdf: category === "pdf",
    isAudio: category === "audio",
    isVideo: category === "video",
    isCode: category === "code",
    category,
    streamUrl: `/api/admin/r2/stream?bucket=${encodeURIComponent(bucketId)}&key=${encodeURIComponent(key)}`,
    customMetadata: obj.customMetadata || {},
  };
}
