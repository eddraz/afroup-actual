import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getPublicUser, PUBLIC_SESSION_COOKIE } from "../../lib/public-session";
import {
  BIO_MAX,
  parseBioFields,
  saveUserBios,
  translationAccessForEmail,
} from "../../lib/user-bios";

export const prerender = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getPublicUser(env.DB, cookies.get(PUBLIC_SESSION_COOKIE)?.value);
  if (!user) return json({ ok: false, error: "unauthorized" }, 401);

  const form = await request.formData();
  const bios = parseBioFields(form);
  if (Object.values(bios).some((body) => body.length > BIO_MAX)) {
    return json({ ok: false, error: "bio_too_long" }, 400);
  }

  const access = await translationAccessForEmail(env.DB, user.email);
  await saveUserBios(env.DB, user.id, bios, access);
  return json({ ok: true });
};
