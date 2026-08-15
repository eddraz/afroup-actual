import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { destroyPublicSession, PUBLIC_SESSION_COOKIE } from "../../lib/public-session";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request }) => {
  await destroyPublicSession(env.DB, cookies.get(PUBLIC_SESSION_COOKIE)?.value);
  cookies.delete(PUBLIC_SESSION_COOKIE, { path: "/" });

  const next = new URL(request.url).searchParams.get("next") || "/login";
  return new Response(null, { status: 303, headers: { location: next } });
};
