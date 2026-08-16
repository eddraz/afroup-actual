import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom } from "../../../lib/admin-scope";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const user = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!user) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email },
    }),
    { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
  );
};
