import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getCurrentUser, sessionTokenFrom, unauthorizedJson } from "../../../lib/admin-scope";
import { hasPermission } from "../../../lib/rbac";
import {
  listCollaborateSubmissions,
  getCollaborateSubmissionStats,
  updateCollaborateSubmissionStatus,
  deleteCollaborateSubmission,
} from "../../../lib/collaborate";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// GET: list submissions
export const GET: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canRead = await hasPermission(env.DB, actor.id, "colabora", "read");
  if (!canRead) {
    return json({ ok: false, message: "No tienes permisos para ver postulaciones de colaboradores." }, 403);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "all";
  const search = url.searchParams.get("search") || "";

  const submissions = await listCollaborateSubmissions(env.DB, { status, search });
  const stats = await getCollaborateSubmissionStats(env.DB);

  return json({ ok: true, submissions, stats });
};

// PATCH: update submission status / notes
export const PATCH: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canUpdate = await hasPermission(env.DB, actor.id, "colabora", "update");
  if (!canUpdate) {
    return json({ ok: false, message: "No tienes permisos para actualizar postulaciones." }, 403);
  }

  let data: any = {};
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await request.json();
  } else {
    const form = await request.formData();
    data = Object.fromEntries(form.entries());
  }

  const id = Number(data.id);
  const status = String(data.status || "unread").trim();
  const notes = data.notes !== undefined ? String(data.notes) : undefined;

  if (!id) {
    return json({ ok: false, message: "ID de postulación no proporcionado." }, 400);
  }

  const ok = await updateCollaborateSubmissionStatus(env.DB, id, status, notes);
  if (!ok) {
    return json({ ok: false, message: "Error al actualizar la postulación." }, 500);
  }

  return json({ ok: true, message: "Estado de postulación actualizado con éxito." });
};

// DELETE: delete submission
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const actor = await getCurrentUser(env.DB, sessionTokenFrom(cookies));
  if (!actor) return unauthorizedJson();

  const canDelete = await hasPermission(env.DB, actor.id, "colabora", "delete");
  if (!canDelete) {
    return json({ ok: false, message: "No tienes permisos para eliminar postulaciones." }, 403);
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
    return json({ ok: false, message: "ID no proporcionado." }, 400);
  }

  const ok = await deleteCollaborateSubmission(env.DB, id);
  if (!ok) {
    return json({ ok: false, message: "Error al eliminar la postulación." }, 500);
  }

  return json({ ok: true, message: "Postulación eliminada." });
};
