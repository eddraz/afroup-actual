import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createCollaborateSubmission } from "../../lib/collaborate";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    let data: any = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries(form.entries());
    }

    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || undefined;
    const result = await createCollaborateSubmission(env.DB, data, ip);

    if (!result.ok) {
      return json({ ok: false, message: result.error || "Datos de postulación no válidos." }, 400);
    }

    return json({
      ok: true,
      id: result.id,
      message: "¡Gracias por tu postulación! Te contactaremos en menos de 72 horas.",
    });
  } catch (error: any) {
    return json({ ok: false, message: "Error interno al enviar la postulación." }, 500);
  }
};
