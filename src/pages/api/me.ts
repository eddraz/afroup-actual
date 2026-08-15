import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getAdminUserByEmail, getPublicUser, PUBLIC_SESSION_COOKIE } from "../../lib/public-session";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const user = await getPublicUser(env.DB, cookies.get(PUBLIC_SESSION_COOKIE)?.value);
  if (!user) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
  const admin = await getAdminUserByEmail(env.DB, user.email);
  return new Response(
    JSON.stringify({
      ok: true,
      user,
      admin: admin ? { id: admin.id, name: admin.name, email: admin.email } : null,
    }),
    { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
  );
};
