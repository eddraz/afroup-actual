import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  destroyPublicSession,
  getPublicUser,
  PUBLIC_SESSION_COOKIE,
} from "../../lib/public-session";
import { hasPermission } from "../../lib/rbac";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function avatarKeyFromUrl(url: string | null | undefined, userId: number) {
  const prefix = "/api/avatar/";
  if (!url || !url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length);
  if (!key.startsWith(`avatars/${userId}/`)) return null;
  return key;
}

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const user = await getPublicUser(env.DB, cookies.get(PUBLIC_SESSION_COOKIE)?.value);
  if (!user) return json({ ok: false, error: "unauthorized" }, 401);
  if (!(await hasPermission(env.DB, user.id, "users", "update"))) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  const form = await request.formData();
  const confirm = String(form.get("confirm") ?? "").trim().toLowerCase();
  if (confirm !== "eliminar" && confirm !== "delete") {
    return json({ ok: false, error: "confirm_mismatch" }, 400);
  }

  const key = avatarKeyFromUrl(user.avatar_url, user.id);
  if (key) await env.AVATARS.delete(key);

  await env.DB.batch([
    env.DB.prepare("UPDATE users SET created_by = NULL WHERE created_by = ?").bind(user.id),
    env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
  ]);

  await destroyPublicSession(env.DB, cookies.get(PUBLIC_SESSION_COOKIE)?.value);
  cookies.delete(PUBLIC_SESSION_COOKIE, { path: "/" });
  return json({ ok: true });
};
