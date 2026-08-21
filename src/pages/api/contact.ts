import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createContactSubmission } from "../../lib/contact";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get("content-type") || "";
  let name = "";
  let email = "";
  let subject = "";
  let message = "";
  let locale = "es";

  if (contentType.includes("application/json")) {
    try {
      const data = await request.json();
      name = String(data.name || "");
      email = String(data.email || "");
      subject = String(data.subject || "");
      message = String(data.message || "");
      locale = String(data.locale || "es");
    } catch {
      return json({ ok: false, message: "Cuerpo de solicitud no válido." }, 400);
    }
  } else {
    const form = await request.formData();
    name = String(form.get("name") || "");
    email = String(form.get("email") || "");
    subject = String(form.get("subject") || "");
    message = String(form.get("message") || "");
    locale = String(form.get("locale") || "es");
  }

  const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
  const userAgent = request.headers.get("user-agent") || "";

  const result = await createContactSubmission(env.DB, {
    name,
    email,
    subject,
    message,
    locale,
    ip: clientIp,
    userAgent,
  });

  if (!result.ok) {
    return json({ ok: false, message: result.error || "No se pudo enviar el mensaje." }, 400);
  }

  const successMsg =
    locale === "en"
      ? "Thank you for reaching out! We will reply in less than 72 hours."
      : "¡Gracias por contactarnos! Hemos recibido tu mensaje y te responderemos en menos de 72 horas.";

  return json({
    ok: true,
    id: result.id,
    message: successMsg,
  });
};
