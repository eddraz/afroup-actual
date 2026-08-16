import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { sendResetEmail, type EmailLocale } from "../../lib/email";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MS = 1000 * 60 * 60;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function isLocale(value: unknown): value is EmailLocale {
  return value === "es" || value === "en";
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const locale: EmailLocale = isLocale(form.get("locale")) ? (form.get("locale") as EmailLocale) : "es";
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: "email_invalid" }, 400);

  const user = await env.DB.prepare(
    "SELECT id, name, email FROM users WHERE email = ? LIMIT 1",
  )
    .bind(email)
    .first<{ id: number; name: string; email: string }>();

  if (user) {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
    await env.DB.prepare(
      "UPDATE afroup_password_resets SET consumed_at = datetime('now') WHERE user_id = ? AND consumed_at IS NULL",
    )
      .bind(user.id)
      .run();
    await env.DB.prepare(
      "INSERT INTO afroup_password_resets (token, user_id, expires_at) VALUES (?, ?, ?)",
    )
      .bind(token, user.id, expiresAt)
      .run();

    const resetPath = locale === "en" ? "/en/recuperar/nueva" : "/recuperar/nueva";
    const resetUrl = new URL(`${resetPath}?token=${encodeURIComponent(token)}`, request.url).toString();
    try {
      await sendResetEmail(env, { to: user.email, resetUrl, locale, name: user.name });
    } catch (error) {
      console.error("recover: email send failed", error);
      return json({ ok: false, error: "email_failed" }, 502);
    }
  }

  return json({ ok: true });
};
