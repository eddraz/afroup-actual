import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  getAdminUserByEmail,
  getPublicUser,
  PUBLIC_SESSION_COOKIE,
} from "../../../lib/public-session";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const publicUser = await getPublicUser(env.DB, cookies.get(PUBLIC_SESSION_COOKIE)?.value);
  if (!publicUser) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const admin = await getAdminUserByEmail(env.DB, publicUser.email);
  if (!admin) {
    return new Response(JSON.stringify({ ok: false, error: "not_admin" }), {
      status: 403,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      user: { id: admin.id, name: admin.name, email: admin.email },
    }),
    { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
  );
};
