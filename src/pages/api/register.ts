import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { hashPassword } from "../../lib/crypto";
import { sendVerificationEmail, type EmailLocale } from "../../lib/email";

export const prerender = false;

interface RegisterBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  locale?: unknown;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function readBody(request: Request): Promise<RegisterBody> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await request.json().catch(() => ({}))) as RegisterBody;
  }
  const form = await request.formData();
  return {
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
    locale: form.get("locale"),
  };
}

function isLocale(value: unknown): value is EmailLocale {
  return value === "es" || value === "en";
}

export const POST: APIRoute = async ({ request }) => {
  const body = await readBody(request);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const locale: EmailLocale = isLocale(body.locale) ? body.locale : "es";

  if (!name) return json({ ok: false, error: "name_required" }, 400);
  if (!EMAIL_RE.test(email)) return json({ ok: false, error: "email_invalid" }, 400);
  if (password.length < 8) return json({ ok: false, error: "password_short" }, 400);

  const existing = await env.DB.prepare(
    "SELECT id FROM afroup_users WHERE email = ? LIMIT 1",
  ).bind(email).first<{ id: number }>();
  if (existing) return json({ ok: false, error: "email_taken" }, 409);

  const passwordHash = await hashPassword(password);

  const insert = await env.DB.prepare(
    "INSERT INTO afroup_users (name, email, password_hash) VALUES (?, ?, ?) RETURNING id",
  ).bind(name, email, passwordHash).first<{ id: number }>();
  if (!insert) return json({ ok: false, error: "insert_failed" }, 500);

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  await env.DB.prepare(
    "INSERT INTO afroup_email_verifications (token, user_id, expires_at) VALUES (?, ?, ?)",
  ).bind(token, insert.id, expiresAt).run();

  const verifyPath = locale === "en" ? "/en/verificar" : "/verificar";
  const verifyUrl = new URL(`${verifyPath}?token=${encodeURIComponent(token)}`, request.url).toString();
  try {
    const sent = await sendVerificationEmail(env, { to: email, verifyUrl, locale, name });
    console.log("register: verification email accepted", { to: email, sent });
  } catch (error) {
    console.error("register: email send failed", error);
    await env.DB.prepare(
      "UPDATE afroup_users SET updated_at = datetime('now') WHERE id = ?",
    ).bind(insert.id).run();
    return json({ ok: false, error: "email_failed" }, 502);
  }

  return json({ ok: true, emailSentTo: email });
};