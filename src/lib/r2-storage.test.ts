import { describe, expect, test } from "bun:test";
import { formatBytes, getFileCategory, mapR2Object, KNOWN_BUCKETS, resolveR2Bucket } from "./r2-storage";

describe("r2-storage helper", () => {
  test("formatBytes formats units accurately", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(1048576 * 2.5)).toBe("2.5 MB");
    expect(formatBytes(1073741824)).toBe("1 GB");
  });

  test("getFileCategory categorizes files by mime and extension", () => {
    expect(getFileCategory("image/png", "photo.png")).toBe("image");
    expect(getFileCategory("image/jpeg", "avatar.jpg")).toBe("image");
    expect(getFileCategory("application/pdf", "guide.pdf")).toBe("pdf");
    expect(getFileCategory("audio/mpeg", "track.mp3")).toBe("audio");
    expect(getFileCategory("video/mp4", "intro.mp4")).toBe("video");
    expect(getFileCategory("application/json", "data.json")).toBe("code");
    expect(getFileCategory("application/zip", "archive.zip")).toBe("archive");
    expect(getFileCategory("text/plain", "readme.txt")).toBe("document");
    expect(getFileCategory("application/octet-stream", "unknown.xyz")).toBe("other");
  });

  test("resolveR2Bucket finds bucket by id, bindingName or bucketName", () => {
    const mockEnv = {
      AVATARS: { list: async () => ({ objects: [] }) },
      MEDIA: { list: async () => ({ objects: [] }) },
    };

    const resolved = resolveR2Bucket(mockEnv, "avatars");
    expect(resolved).not.toBeNull();
    expect(resolved?.definition.id).toBe("avatars");
    expect(resolved?.definition.bindingName).toBe("AVATARS");

    const resolvedMedia = resolveR2Bucket(mockEnv, "afroup-media");
    expect(resolvedMedia).not.toBeNull();
    expect(resolvedMedia?.definition.id).toBe("media");

    const missing = resolveR2Bucket(mockEnv, "nonexistent");
    expect(missing).toBeNull();
  });

  test("mapR2Object transforms R2 object into structured summary", () => {
    const r2Raw = {
      key: "covers/articles/2026/afro-art.webp",
      size: 450000,
      uploaded: new Date("2026-08-20T12:00:00Z"),
      etag: "d41d8cd98f00b204e9800998ecf8427e",
      httpMetadata: {
        contentType: "image/webp",
      },
      customMetadata: {
        author: "Editor AfroUp",
      },
    };

    const summary = mapR2Object(r2Raw, "media", "es");
    expect(summary.name).toBe("afro-art.webp");
    expect(summary.path).toBe("covers/articles/2026");
    expect(summary.isImage).toBe(true);
    expect(summary.category).toBe("image");
    expect(summary.formattedSize).toContain("KB");
    expect(summary.streamUrl).toContain("/api/admin/r2/stream?bucket=media&key=");
    expect(summary.customMetadata?.author).toBe("Editor AfroUp");
  });
});
