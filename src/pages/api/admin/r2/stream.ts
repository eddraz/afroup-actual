import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom } from "../../../../lib/admin-scope";
import { hasPermission } from "../../../../lib/rbac";
import { resolveR2Bucket } from "../../../../lib/r2-storage";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const bucketId = url.searchParams.get("bucket") || "media";
  const key = url.searchParams.get("key") || "";
  const download = url.searchParams.get("download") === "1";

  if (!key) {
    return new Response("Missing object key", { status: 400 });
  }

  // Public buckets (media, avatars) allow unauthenticated streaming for public rendering
  const isPublicBucket = bucketId === "media" || bucketId === "avatars";
  if (!isPublicBucket) {
    const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
    if (!actor) {
      return new Response("Unauthorized", { status: 401 });
    }
    if (!(await hasPermission(env.DB, actor.id, "almacenamiento", "read"))) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const resolved = resolveR2Bucket(env as any, bucketId);
  if (!resolved) {
    return new Response("Bucket not found", { status: 404 });
  }

  try {
    const object = await resolved.bucket.get(key);
    if (!object) {
      return new Response("Object not found in bucket", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag || object.etag);

    const filename = key.split("/").pop() || "download";
    if (download) {
      headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    } else {
      headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`);
    }

    if (!headers.get("Content-Type")) {
      headers.set("Content-Type", "application/octet-stream");
    }

    headers.set("Cache-Control", "public, max-age=86400, immutable");

    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new Response(err?.message || "Internal Server Error", { status: 500 });
  }
};
