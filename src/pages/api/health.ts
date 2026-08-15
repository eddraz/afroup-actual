import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = async () => {
  const row = await env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
  return Response.json({
    ok: row?.ok === 1,
    app: env.APP_NAME || "AfroUp",
  });
};
