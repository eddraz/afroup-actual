import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import { listContactSubmissions, getContactSubmissionStats } from "../../../lib/contact";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// GET: list submissions & stats
export const GET: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canRead = await hasPermission(env.DB, actor.id, "contacto", "read");
  if (!canRead) {
    return json({ ok: false, message: "No tienes permisos para ver los mensajes de contacto." }, 403);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "all";
  const search = url.searchParams.get("search") || "";

  const submissions = await listContactSubmissions(env.DB, { status, search });
  const stats = await getContactSubmissionStats(env.DB);

  return json({
    ok: true,
    submissions,
    stats,
  });
};

// PATCH: update status or notes
export const PATCH: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canUpdate = await hasPermission(env.DB, actor.id, "contacto", "update");
  if (!canUpdate) {
    return json({ ok: false, message: "No tienes permisos para actualizar mensajes de contacto." }, 403);
  }

  const data = await request.json();
  const id = Number(data.id);
  if (!id) {
    return json({ ok: false, message: "ID de mensaje no proporcionado." }, 400);
  }

  const status = data.status ? String(data.status).trim() : undefined;
  const adminNotes = data.admin_notes !== undefined ? String(data.admin_notes).trim() : undefined;

  let query = "UPDATE contact_submissions SET updated_at = datetime('now')";
  const params: any[] = [];

  if (status) {
    query += ", status = ?";
    params.push(status);
  }
  if (adminNotes !== undefined) {
    query += ", admin_notes = ?";
    params.push(adminNotes);
  }

  query += " WHERE id = ?";
  params.push(id);

  await env.DB.prepare(query).bind(...params).run();

  return json({ ok: true, message: "Mensaje de contacto actualizado con éxito." });
};

// DELETE: remove submission
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canDelete = await hasPermission(env.DB, actor.id, "contacto", "delete");
  if (!canDelete) {
    return json({ ok: false, message: "No tienes permisos para eliminar mensajes de contacto." }, 403);
  }

  const url = new URL(request.url);
  const idParam = url.searchParams.get("id");
  let id = Number(idParam);

  if (!id) {
    try {
      const data = await request.json();
      id = Number(data.id);
    } catch {}
  }

  if (!id) {
    return json({ ok: false, message: "ID de mensaje no proporcionado." }, 400);
  }

  await env.DB.prepare("DELETE FROM contact_submissions WHERE id = ?").bind(id).run();

  return json({ ok: true, message: "Mensaje de contacto eliminado." });
};
