import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import { KNOWN_BUCKETS, resolveR2Bucket, mapR2Object, type R2ItemSummary } from "../../../lib/r2-storage";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return json({ ok: false, error: "unauthorized" }, 401);
  if (!(await hasPermission(env.DB, actor.id, "almacenamiento", "read"))) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  const requestedBucket = url.searchParams.get("bucket") || "media";
  const prefix = url.searchParams.get("prefix") || "";
  const delimiter = url.searchParams.get("delimiter") || "";
  const search = (url.searchParams.get("search") || "").trim().toLowerCase();
  const limit = Math.min(Number(url.searchParams.get("limit") || 200), 500);

  const resolved = resolveR2Bucket(env as any, requestedBucket);
  if (!resolved) {
    return json({ ok: false, error: "bucket_not_found" }, 404);
  }

  try {
    const listOptions: any = {
      limit,
      prefix: prefix || undefined,
      delimiter: delimiter || undefined,
      include: ["httpMetadata", "customMetadata"],
    };

    const result = await resolved.bucket.list(listOptions);
    const rawObjects = result.objects || [];

    let objects: R2ItemSummary[] = rawObjects.map((obj: any) => mapR2Object(obj, resolved.definition.id));

    if (search) {
      objects = objects.filter((o) => o.key.toLowerCase().includes(search) || o.name.toLowerCase().includes(search));
    }

    const totalBytes = objects.reduce((acc, obj) => acc + obj.size, 0);

    return json({
      ok: true,
      bucket: resolved.definition,
      objects,
      prefixes: result.delimitedPrefixes || [],
      truncated: result.truncated || false,
      cursor: result.cursor,
      totalCount: objects.length,
      totalBytes,
    });
  } catch (err: any) {
    return json({ ok: false, error: err?.message || "r2_list_failed" }, 500);
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return json({ ok: false, error: "unauthorized" }, 401);

  const formData = await request.formData();
  const intent = String(formData.get("_intent") || "upload");
  const bucketId = String(formData.get("bucket") || "media");

  const resolved = resolveR2Bucket(env as any, bucketId);
  if (!resolved) {
    return json({ ok: false, error: "bucket_not_found" }, 404);
  }

  if (intent === "delete") {
    if (!(await hasPermission(env.DB, actor.id, "almacenamiento", "delete"))) {
      return json({ ok: false, error: "forbidden" }, 403);
    }

    const key = String(formData.get("key") || "");
    if (!key) return json({ ok: false, error: "missing_key" }, 400);

    try {
      await resolved.bucket.delete(key);
      return json({ ok: true, deleted: key });
    } catch (err: any) {
      return json({ ok: false, error: err?.message || "delete_failed" }, 500);
    }
  }

  if (intent === "upload") {
    if (!(await hasPermission(env.DB, actor.id, "almacenamiento", "create"))) {
      return json({ ok: false, error: "forbidden" }, 403);
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return json({ ok: false, error: "missing_file" }, 400);
    }

    const prefix = String(formData.get("prefix") || "").trim().replace(/^\/+|\/+$/g, "");
    let customName = String(formData.get("customName") || "").trim();
    if (!customName) {
      customName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    }

    const key = prefix ? `${prefix}/${customName}` : customName;

    try {
      const buffer = await file.arrayBuffer();
      await resolved.bucket.put(key, buffer, {
        httpMetadata: {
          contentType: file.type || "application/octet-stream",
          cacheControl: "public, max-age=31536000, immutable",
        },
        customMetadata: {
          uploaded_by: String(actor.id),
          uploader_name: actor.name || "Admin",
        },
      });

      return json({
        ok: true,
        key,
        size: file.size,
        contentType: file.type,
        streamUrl: `/api/admin/r2/stream?bucket=${encodeURIComponent(resolved.definition.id)}&key=${encodeURIComponent(key)}`,
      });
    } catch (err: any) {
      return json({ ok: false, error: err?.message || "upload_failed" }, 500);
    }
  }

  if (intent === "create_folder") {
    if (!(await hasPermission(env.DB, actor.id, "almacenamiento", "create"))) {
      return json({ ok: false, error: "forbidden" }, 403);
    }

    const folderName = String(formData.get("folderName") || "").trim().replace(/^\/+|\/+$/g, "");
    const parentPrefix = String(formData.get("prefix") || "").trim().replace(/^\/+|\/+$/g, "");
    if (!folderName) return json({ ok: false, error: "missing_folder_name" }, 400);

    const fullPath = parentPrefix ? `${parentPrefix}/${folderName}` : folderName;
    const keepKey = `${fullPath}/.keep`;

    try {
      await resolved.bucket.put(keepKey, new Uint8Array(0), {
        httpMetadata: { contentType: "application/x-directory" },
      });
      return json({ ok: true, folder: fullPath });
    } catch (err: any) {
      return json({ ok: false, error: err?.message || "create_folder_failed" }, 500);
    }
  }

  if (intent === "fetch_url") {
    if (!(await hasPermission(env.DB, actor.id, "almacenamiento", "create"))) {
      return json({ ok: false, error: "forbidden" }, 403);
    }

    const sourceUrl = String(formData.get("sourceUrl") || "").trim();
    if (!sourceUrl || (!sourceUrl.startsWith("http://") && !sourceUrl.startsWith("https://"))) {
      return json({ ok: false, error: "invalid_url" }, 400);
    }

    try {
      const response = await fetch(sourceUrl, {
        headers: {
          "User-Agent": "AfroUp-Storage-Worker/1.0",
        },
      });

      if (!response.ok) {
        return json({ ok: false, error: `fetch_failed_${response.status}` }, 400);
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream";
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Derive file name from URL path
      const urlObj = new URL(sourceUrl);
      let fileName = urlObj.pathname.split("/").pop() || "downloaded-file";
      if (!fileName.includes(".")) {
        const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : contentType.includes("jpeg") ? "jpg" : "bin";
        fileName = `${fileName}.${ext}`;
      }

      // Convert to base64 for direct client-side canvas optimization
      let binary = "";
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const dataUrl = `data:${contentType};base64,${base64}`;

      return json({
        ok: true,
        dataUrl,
        contentType,
        fileName,
        size: bytes.byteLength,
      });
    } catch (err: any) {
      return json({ ok: false, error: err?.message || "fetch_url_failed" }, 500);
    }
  }

  return json({ ok: false, error: "invalid_intent" }, 400);
};
