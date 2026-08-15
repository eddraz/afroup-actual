import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const key = params.key;
  if (!key || !key.startsWith("avatars/")) {
    return new Response("Not found", { status: 404 });
  }

  const object = await env.AVATARS.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("cache-control", object.httpMetadata?.cacheControl || "public, max-age=31536000, immutable");
  headers.set("content-type", object.httpMetadata?.contentType || "image/jpeg");
  return new Response(object.body, { headers });
};
