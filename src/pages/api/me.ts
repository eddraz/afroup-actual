import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { permissionsFromNamedRows } from "../../lib/identity-auth";
import { getPublicUser, PUBLIC_SESSION_COOKIE } from "../../lib/public-session";
import { effectivePermissions, mergePermissions } from "../../lib/rbac";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const user = await getPublicUser(env.DB, cookies.get(PUBLIC_SESSION_COOKIE)?.value);
  if (!user) {
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
  const permissions = permissionsFromNamedRows(
    mergePermissions(await effectivePermissions(env.DB, user.id)),
  );
  return new Response(
    JSON.stringify({
      ok: true,
      user,
      permissions,
    }),
    { status: 200, headers: { "content-type": "application/json; charset=utf-8" } },
  );
};
