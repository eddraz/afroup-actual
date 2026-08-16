import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

function redirect(path: string, status = 303) {
  return new Response(null, { status, headers: { location: path } });
}

export const GET: APIRoute = async ({ url, request }) => {
  const token = url.searchParams.get("token");
  if (!token) return redirect("/login?verified=invalid");

  const row = await env.DB.prepare(
    `SELECT v.token, v.expires_at, v.consumed_at, u.email, u.verified_at
       FROM afroup_email_verifications v
       JOIN users u ON u.id = v.user_id
      WHERE v.token = ? LIMIT 1`,
  ).bind(token).first<{
    token: string;
    expires_at: string;
    consumed_at: string | null;
    email: string;
    verified_at: string | null;
  }>();

  if (!row) return redirect("/login?verified=invalid");
  if (row.consumed_at) return redirect("/login?verified=already");
  if (Date.parse(row.expires_at) < Date.now()) {
    return redirect("/login?verified=expired");
  }

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE users SET verified_at = ?, updated_at = ? WHERE email = ? AND verified_at IS NULL",
    ).bind(now, now, row.email),
    env.DB.prepare(
      "UPDATE afroup_email_verifications SET consumed_at = ? WHERE token = ?",
    ).bind(now, token),
  ]);

  const loginPath = new URL("/login?verified=1", request.url).pathname + new URL("/login?verified=1", request.url).search;
  return redirect(loginPath);
};