import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const key = params.key;
  if (!key) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const object = await env.MEDIA.get(key);
    if (!object) return new Response("Not found", { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag || object.etag);
    headers.set("cache-control", object.httpMetadata?.cacheControl || "public, max-age=31536000, immutable");

    if (!headers.get("content-type")) {
      if (key.endsWith(".webp")) headers.set("content-type", "image/webp");
      else if (key.endsWith(".png")) headers.set("content-type", "image/png");
      else if (key.endsWith(".jpg") || key.endsWith(".jpeg")) headers.set("content-type", "image/jpeg");
      else if (key.endsWith(".mp4")) headers.set("content-type", "video/mp4");
      else if (key.endsWith(".svg")) headers.set("content-type", "image/svg+xml");
      else headers.set("content-type", "application/octet-stream");
    }

    return new Response(object.body, { headers });
  } catch (err: any) {
    return new Response(err?.message || "Internal Server Error", { status: 500 });
  }
};
