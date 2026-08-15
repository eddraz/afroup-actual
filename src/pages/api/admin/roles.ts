import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { hashPassword } from "../../../lib/crypto";

export const prerender = false;

async function readBody(request: Request) {
  const form = await request.formData();
  return {
    intent: form.get("_intent"),
    id: form.get("id"),
    name: form.get("name"),
    description: form.get("description"),
    email: form.get("email"),
    password: form.get("password"),
    roleId: form.get("roleId"),
    isActive: form.get("isActive"),
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const body = await readBody(request);

  if (body.intent === "delete_role" && typeof body.id === "string") {
    const id = Number(body.id);
    if (!Number.isFinite(id)) return json({ ok: false, error: "bad_id" }, 400);
    await env.DB.prepare("DELETE FROM admin_roles WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  if (body.intent === "create_role") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    if (!name) return json({ ok: false, error: "name_required" }, 400);
    const existing = await env.DB.prepare("SELECT id FROM admin_roles WHERE name = ? LIMIT 1").bind(name).first<{ id: number }>();
    if (existing) return json({ ok: false, error: "name_taken" }, 409);
    await env.DB.prepare("INSERT INTO admin_roles (name, description) VALUES (?, ?)").bind(name, description || null).run();
    return json({ ok: true });
  }

  if (body.intent === "create_user") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const roleId = body.roleId ? Number(body.roleId) : null;
    const isActive = body.isActive === "0" ? 0 : 1;
    if (!name) return json({ ok: false, error: "name_required" }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "email_invalid" }, 400);
    if (password.length < 8) return json({ ok: false, error: "password_short" }, 400);
    const existing = await env.DB.prepare("SELECT id FROM admin_users WHERE email = ? LIMIT 1").bind(email).first<{ id: number }>();
    if (existing) return json({ ok: false, error: "email_taken" }, 409);
    const hash = await hashPassword(password);
    await env.DB.prepare(
      "INSERT INTO admin_users (name, email, password_hash, role_id, is_active) VALUES (?, ?, ?, ?, ?)",
    ).bind(name, email, hash, roleId, isActive).run();
    return json({ ok: true });
  }

  if (body.intent === "delete_user" && typeof body.id === "string") {
    const id = Number(body.id);
    if (!Number.isFinite(id)) return json({ ok: false, error: "bad_id" }, 400);
    await env.DB.prepare("DELETE FROM admin_users WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  return json({ ok: false, error: "unknown_intent" }, 400);
};