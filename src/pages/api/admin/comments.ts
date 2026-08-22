import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import {
  isCommentStatus,
  loadCommentById,
  loadComments,
  getCommentsStats,
  normalizeCommentBody,
} from "../../../lib/comments";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// GET: list or filter comments
export const GET: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canRead = await hasPermission(env.DB, actor.id, "comentarios", "read");
  if (!canRead) {
    return json({ ok: false, message: "No tienes permisos para ver comentarios." }, 403);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const search = url.searchParams.get("search") || "";

  const comments = await loadComments(env.DB, { status, search });
  const stats = await getCommentsStats(env.DB);

  return json({ ok: true, comments, stats });
};

// POST: moderate a comment (status and/or admin reply)
export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const form = await request.formData();
  const idRaw = form.get("id");
  const id = idRaw ? Number(idRaw) : null;

  if (!id) {
    return json({ ok: false, message: "ID de comentario no proporcionado." }, 400);
  }

  const existing = await loadCommentById(env.DB, id);
  if (!existing) {
    return json({ ok: false, message: "Comentario no encontrado." }, 404);
  }

  const canUpdate = await hasPermission(env.DB, actor.id, "comentarios", "update");
  if (!canUpdate) {
    return json({ ok: false, message: "No tienes permisos para moderar comentarios." }, 403);
  }

  const sets: string[] = [];
  const params: any[] = [];

  const statusRaw = form.get("status");
  if (statusRaw !== null && String(statusRaw).trim() !== "") {
    const status = String(statusRaw).trim();
    if (!isCommentStatus(status)) {
      return json({ ok: false, message: "Estado de comentario no válido." }, 400);
    }
    sets.push("status = ?");
    params.push(status);
  }

  if (form.has("admin_reply")) {
    sets.push("admin_reply = ?");
    params.push(normalizeCommentBody(form.get("admin_reply")));
  }

  if (sets.length === 0) {
    return json({ ok: false, message: "No hay cambios que aplicar al comentario." }, 400);
  }

  sets.push("updated_at = datetime('now')");
  await env.DB.prepare(`UPDATE user_comments SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...params, id)
    .run();

  return json({
    ok: true,
    message: "Comentario actualizado con éxito.",
    comment: await loadCommentById(env.DB, id),
  });
};

// DELETE: remove comment
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canDelete = await hasPermission(env.DB, actor.id, "comentarios", "delete");
  if (!canDelete) {
    return json({ ok: false, message: "No tienes permisos para eliminar comentarios." }, 403);
  }

  const url = new URL(request.url);
  const idRaw = url.searchParams.get("id");
  const id = idRaw ? Number(idRaw) : null;

  if (!id) {
    return json({ ok: false, message: "ID de comentario no proporcionado." }, 400);
  }

  await env.DB.prepare("DELETE FROM user_comments WHERE id = ?").bind(id).run();

  return json({ ok: true, message: "Comentario eliminado." });
};
