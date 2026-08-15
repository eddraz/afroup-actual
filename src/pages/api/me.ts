import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getPublicUser, PUBLIC_SESSION_COOKIE } from "../../lib/public-session";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const user = await getPublicUser(env.DB, cookies.get(PUBLIC_SESSION_COOKIE)?.value);
  if (!user) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
  return new Response(JSON.stringify({ ok: true, user }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
