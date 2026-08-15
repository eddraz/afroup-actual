const COOKIE_NAME = "afroup_admin";
const CSRF_COOKIE = "afroup_csrf";
const SESSION_HOURS = 12;
const MAX_JSON_BYTES = 16_384;
const MAX_FIELD = 500;
const MAX_BODY = 4000;
const LOGIN_WINDOW_MIN = 15;
const LOGIN_MAX_ATTEMPTS = 8;
const SUBMIT_WINDOW_MIN = 60;
const SUBMIT_MAX_ATTEMPTS = 5;
const PUBLIC_ENTRY_FIELDS = [
  "id",
  "department_id",
  "department_slug",
  "department_name",
  "title",
  "summary",
  "body",
  "contact_name",
  "contact_phone",
  "contact_email",
  "location",
  "category",
  "source",
  "created_at",
  "published_at",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/admin" || path === "/admin/") {
        return withSecurityHeaders(request, await env.ASSETS.fetch(new URL("/admin.html", url.origin)), { noStore: true });
      }

      if (path === "/admin/password" || path === "/admin/password/") {
        return withSecurityHeaders(request, await env.ASSETS.fetch(new URL("/admin-password.html", url.origin)), { noStore: true });
      }

      if (path.startsWith("/api/")) {
        return handleApi(request, env, url);
      }
    } catch (err) {
      console.error(err);
      return json({ error: "Error interno del servidor." }, 500);
    }

    return withSecurityHeaders(request, await env.ASSETS.fetch(request));
  },
};

async function handleApi(request, env, url) {
  const path = url.pathname;
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, { status: 204, headers: securityHeaders(request) });
  }

  if (path === "/api/departments" && method === "GET") {
    return listDepartments(env);
  }

  if (path === "/api/entries" && method === "GET") {
    return listPublishedEntries(env, url);
  }

  if (path === "/api/entries" && method === "POST") {
    return createPendingEntry(request, env);
  }

  if (path === "/api/admin/login" && method === "POST") {
    return adminLogin(request, env);
  }

  if (path === "/api/admin/logout" && method === "POST") {
    return adminLogout(request, env);
  }

  if (path === "/api/admin/session" && method === "GET") {
    return adminSession(request, env);
  }

  if (path === "/api/admin/password" && method === "POST") {
    return changeAdminPassword(request, env);
  }

  if (path === "/api/admin/entries" && method === "GET") {
    return listAdminEntries(request, env, url);
  }

  if (path === "/api/admin/categories" && method === "GET") {
    return listAdminCategories(request, env);
  }

  const entryMatch = path.match(/^\/api\/admin\/entries\/(\d+)$/);
  if (entryMatch && method === "PATCH") {
    return updateAdminEntry(request, env, Number(entryMatch[1]));
  }
  if (entryMatch && method === "DELETE") {
    return deleteAdminEntry(request, env, Number(entryMatch[1]));
  }

  return json({ error: "No encontrado." }, 404);
}

async function listDepartments(env) {
  const { results } = await env.DB.prepare(
    `SELECT d.id, d.slug, d.name,
            COUNT(e.id) AS published_count
       FROM departments d
       LEFT JOIN aid_entries e
         ON e.department_id = d.id AND e.status = 'published'
      GROUP BY d.id
      ORDER BY CASE d.slug WHEN 'choco' THEN 0 WHEN 'otros' THEN 2 ELSE 1 END, d.name`
  ).all();

  return json({ departments: results || [] });
}

async function listPublishedEntries(env, url) {
  const department = (url.searchParams.get("department") || "").trim();
  const q = (url.searchParams.get("q") || "").trim();

  const where = ["e.status = 'published'"];
  const binds = [];

  if (department) {
    where.push("d.slug = ?");
    binds.push(department);
  }

  if (q) {
    const like = `%${q}%`;
    where.push(
      `(e.title LIKE ? OR IFNULL(e.summary, '') LIKE ? OR IFNULL(e.body, '') LIKE ?
        OR IFNULL(e.location, '') LIKE ? OR IFNULL(e.contact_name, '') LIKE ?
        OR IFNULL(e.contact_phone, '') LIKE ? OR IFNULL(e.contact_email, '') LIKE ?)`
    );
    binds.push(like, like, like, like, like, like, like);
  }

  const { results } = await env.DB.prepare(
    `SELECT e.id, e.department_id, d.slug AS department_slug, d.name AS department_name,
            e.title, e.summary, e.body, e.contact_name, e.contact_phone, e.contact_email,
            e.location, e.category, e.source, e.created_at, e.published_at
       FROM aid_entries e
       JOIN departments d ON d.id = e.department_id
      WHERE ${where.join(" AND ")}
      ORDER BY CASE d.slug WHEN 'choco' THEN 0 WHEN 'otros' THEN 2 ELSE 1 END, d.name, e.published_at DESC, e.id DESC`
  )
    .bind(...binds)
    .all();

  return json({ entries: (results || []).map(pickPublicEntry) });
}

async function createPendingEntry(request, env) {
  const limited = await enforceRateLimit(env, clientIp(request), "submit", SUBMIT_WINDOW_MIN, SUBMIT_MAX_ATTEMPTS);
  if (limited) return limited;

  const body = await readJson(request);
  if (!body) return json({ error: "JSON inválido." }, 400);

  const departmentSlug = text(body.department || body.department_slug, 80);
  const title = text(body.title, 180);
  const summary = text(body.summary, MAX_FIELD);
  const details = text(body.body, MAX_BODY);
  const contactName = text(body.contact_name, 120);
  const contactPhone = text(body.contact_phone, 80);
  const contactEmail = text(body.contact_email, 180);
  const location = text(body.location, 240);
  const category = text(body.category, 80);
  const source = text(body.source, 180);
  const submittedByName = text(body.submitted_by_name, 120);
  const submittedByContact = text(body.submitted_by_contact, 180);

  if (!departmentSlug) return json({ error: "El departamento es obligatorio." }, 400);
  if (!title) return json({ error: "El título es obligatorio." }, 400);
  if (!summary && !details) {
    return json({ error: "Incluye un resumen o una descripción." }, 400);
  }
  if (!contactName && !contactPhone && !contactEmail && !submittedByContact) {
    return json({ error: "Incluye al menos un dato de contacto." }, 400);
  }

  const department = await env.DB.prepare(
    "SELECT id FROM departments WHERE slug = ?"
  )
    .bind(departmentSlug)
    .first();

  if (!department) return json({ error: "Departamento no válido." }, 400);

  const result = await env.DB.prepare(
    `INSERT INTO aid_entries (
        department_id, title, summary, body, contact_name, contact_phone, contact_email,
        location, category, source, status, submitted_by_name, submitted_by_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  )
    .bind(
      department.id,
      title,
      summary || null,
      details || null,
      contactName || null,
      contactPhone || null,
      contactEmail || null,
      location || null,
      category || null,
      source || null,
      submittedByName || null,
      submittedByContact || contactPhone || contactEmail || null
    )
    .run();

  return json(
    {
      ok: true,
      id: result.meta.last_row_id,
      status: "pending",
      message: "La información quedó en revisión. Se publicará cuando el equipo la verifique.",
    },
    201
  );
}

async function getStoredCredential(env, username) {
  return env.DB.prepare(
    "SELECT username, password_salt, password_hash FROM admin_credentials WHERE username = ?"
  )
    .bind(username)
    .first();
}

async function hashPassword(password, saltB64) {
  const enc = new TextEncoder();
  const salt = saltB64
    ? Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0))
    : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 },
    key,
    256
  );
  const hash = btoa(String.fromCharCode(...new Uint8Array(bits)));
  const saltOut = btoa(String.fromCharCode(...salt));
  return { salt: saltOut, hash };
}

async function passwordMatches(env, username, password) {
  const expectedUser = env.ADMIN_USER || "";
  if (!expectedUser || !safeEqual(username, expectedUser)) return false;
  const stored = await getStoredCredential(env, expectedUser);
  if (stored) {
    const next = await hashPassword(password, stored.password_salt);
    return safeEqual(next.hash, stored.password_hash);
  }
  const expectedPass = env.ADMIN_PASSWORD || "";
  return Boolean(expectedPass) && safeEqual(password, expectedPass);
}

async function adminLogin(request, env) {
  const ip = clientIp(request);
  const limited = await enforceRateLimit(env, ip, "login", LOGIN_WINDOW_MIN, LOGIN_MAX_ATTEMPTS);
  if (limited) return limited;

  const originCheck = requireSameOrigin(request);
  if (originCheck) return originCheck;

  const body = await readJson(request);
  if (!body) return json({ error: "JSON inválido." }, 400);

  const username = text(body.username, 80);
  const password = text(body.password, 200);
  const expectedUser = env.ADMIN_USER || "";

  if (!expectedUser) {
    return json({ error: "Administración no configurada." }, 500);
  }

  if (!(await passwordMatches(env, username, password))) {
    await recordAttempt(env, ip, "login");
    return json({ error: "Usuario o contraseña incorrectos." }, 401);
  }

  await clearAttempts(env, ip, "login");
  return issueSession(request, env);
}

async function adminSession(request, env) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;
  const csrf = csrfCookies(request);
  return jsonResponse({ ok: true, username: env.ADMIN_USER || "", csrf: csrf.token }, 200, request, csrf.cookies);
}

async function changeAdminPassword(request, env) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const body = await readJson(request);
  if (!body) return json({ error: "JSON inválido." }, 400);

  const currentPassword = text(body.current_password, 200);
  const nextPassword = text(body.new_password, 200);
  const confirmPassword = text(body.confirm_password, 200);
  const username = env.ADMIN_USER || "";

  if (!username) return json({ error: "Administración no configurada." }, 500);
  if (!currentPassword || !nextPassword) {
    return json({ error: "Completa la contraseña actual y la nueva." }, 400);
  }
  if (nextPassword.length < 8) {
    return json({ error: "La nueva contraseña debe tener al menos 8 caracteres." }, 400);
  }
  if (nextPassword !== confirmPassword) {
    return json({ error: "La confirmación no coincide." }, 400);
  }
  if (!(await passwordMatches(env, username, currentPassword))) {
    return json({ error: "La contraseña actual no es correcta." }, 401);
  }

  const hashed = await hashPassword(nextPassword);
  await env.DB.prepare(
    `INSERT INTO admin_credentials (username, password_salt, password_hash, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(username) DO UPDATE SET
       password_salt = excluded.password_salt,
       password_hash = excluded.password_hash,
       updated_at = excluded.updated_at`
  )
    .bind(username, hashed.salt, hashed.hash)
    .run();

  await env.DB.prepare("DELETE FROM admin_sessions").run();
  const issued = await issueSession(request, env, { message: "Contraseña actualizada." });
  return issued;
}

async function adminLogout(request, env) {
  const originCheck = requireSameOrigin(request);
  if (originCheck) return originCheck;
  const sessionId = cookieValue(request, COOKIE_NAME);
  if (sessionId) {
    await env.DB.prepare("DELETE FROM admin_sessions WHERE id = ?").bind(sessionId).run();
  }

  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    ...securityHeaders(request, { noStore: true }),
  });
  headers.append("set-cookie", expiredCookie(request, COOKIE_NAME));
  headers.append("set-cookie", expiredCookie(request, CSRF_COOKIE));
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

async function listAdminCategories(request, env) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;

  const { results } = await env.DB.prepare(
    `SELECT DISTINCT TRIM(category) AS category
       FROM aid_entries
      WHERE category IS NOT NULL AND TRIM(category) != ''
      ORDER BY category COLLATE NOCASE`
  ).all();

  const csrf = csrfCookies(request);
  return jsonResponse(
    { categories: (results || []).map((row) => row.category).filter(Boolean), csrf: csrf.token },
    200,
    request,
    csrf.cookies
  );
}

async function listAdminEntries(request, env, url) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;

  const status = (url.searchParams.get("status") || "pending").trim();
  const q = (url.searchParams.get("q") || "").trim();
  const allowed = ["pending", "published", "rejected", "all"];
  if (!allowed.includes(status)) {
    return json({ error: "Estado no válido." }, 400);
  }

  const where = [];
  const binds = [];
  if (status !== "all") {
    where.push("e.status = ?");
    binds.push(status);
  }
  if (q) {
    const like = `%${q}%`;
    where.push(
      `(e.title LIKE ? OR IFNULL(e.summary, '') LIKE ? OR IFNULL(e.body, '') LIKE ?
        OR IFNULL(e.location, '') LIKE ? OR IFNULL(e.category, '') LIKE ?
        OR IFNULL(e.contact_name, '') LIKE ? OR IFNULL(e.contact_phone, '') LIKE ?
        OR IFNULL(e.contact_email, '') LIKE ? OR d.name LIKE ? OR d.slug LIKE ?)`
    );
    binds.push(like, like, like, like, like, like, like, like, like, like);
  }

  const { results } = await env.DB.prepare(
    `SELECT e.*, d.slug AS department_slug, d.name AS department_name
       FROM aid_entries e
       JOIN departments d ON d.id = e.department_id
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY e.updated_at DESC, e.id DESC`
  )
    .bind(...binds)
    .all();

  const csrf = csrfCookies(request);
  return jsonResponse({ entries: results || [], csrf: csrf.token }, 200, request, csrf.cookies);
}

async function deleteAdminEntry(request, env, id) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const existing = await env.DB.prepare("SELECT id, title, status FROM aid_entries WHERE id = ?")
    .bind(id)
    .first();
  if (!existing) return json({ error: "Registro no encontrado." }, 404);
  if (existing.status !== "rejected") {
    return json({ error: "Solo se pueden eliminar registros rechazados." }, 400);
  }

  await env.DB.prepare("DELETE FROM aid_entries WHERE id = ?").bind(id).run();
  return json({ ok: true, deleted: id, title: existing.title });
}

async function updateAdminEntry(request, env, id) {
  const session = await requireAdmin(request, env);
  if (session instanceof Response) return session;
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const existing = await env.DB.prepare(
    `SELECT e.*, d.slug AS department_slug, d.name AS department_name
       FROM aid_entries e
       JOIN departments d ON d.id = e.department_id
      WHERE e.id = ?`
  )
    .bind(id)
    .first();

  if (!existing) return json({ error: "Registro no encontrado." }, 404);

  const body = await readJson(request);
  if (!body) return json({ error: "JSON inválido." }, 400);

  let departmentId = existing.department_id;
  if (body.department || body.department_slug) {
    const slug = text(body.department || body.department_slug);
    const department = await env.DB.prepare(
      "SELECT id FROM departments WHERE slug = ?"
    )
      .bind(slug)
      .first();
    if (!department) return json({ error: "Departamento no válido." }, 400);
    departmentId = department.id;
  }

  const nextStatus = body.status ? text(body.status) : existing.status;
  if (!["pending", "published", "rejected"].includes(nextStatus)) {
    return json({ error: "Estado no válido." }, 400);
  }

  const title = hasOwn(body, "title") ? text(body.title) : existing.title;
  const summary = hasOwn(body, "summary") ? text(body.summary) : existing.summary;
  const details = hasOwn(body, "body") ? text(body.body) : existing.body;
  const contactName = hasOwn(body, "contact_name") ? text(body.contact_name) : existing.contact_name;
  const contactPhone = hasOwn(body, "contact_phone") ? text(body.contact_phone) : existing.contact_phone;
  const contactEmail = hasOwn(body, "contact_email") ? text(body.contact_email) : existing.contact_email;
  const location = hasOwn(body, "location") ? text(body.location) : existing.location;
  const category = hasOwn(body, "category") ? text(body.category) : existing.category;
  const source = hasOwn(body, "source") ? text(body.source) : existing.source;

  if (!title) return json({ error: "El título es obligatorio." }, 400);

  let publishedAt = existing.published_at;
  if (nextStatus === "published" && existing.status !== "published") {
    publishedAt = new Date().toISOString();
  }
  if (nextStatus !== "published") {
    publishedAt = nextStatus === "published" ? publishedAt : null;
  }

  await env.DB.prepare(
    `UPDATE aid_entries
        SET department_id = ?, title = ?, summary = ?, body = ?, contact_name = ?,
            contact_phone = ?, contact_email = ?, location = ?, category = ?, source = ?,
            status = ?, published_at = ?, updated_at = datetime('now')
      WHERE id = ?`
  )
    .bind(
      departmentId,
      title,
      summary || null,
      details || null,
      contactName || null,
      contactPhone || null,
      contactEmail || null,
      location || null,
      category || null,
      source || null,
      nextStatus,
      publishedAt,
      id
    )
    .run();

  const updated = await env.DB.prepare(
    `SELECT e.*, d.slug AS department_slug, d.name AS department_name
       FROM aid_entries e
       JOIN departments d ON d.id = e.department_id
      WHERE e.id = ?`
  )
    .bind(id)
    .first();

  return json({ ok: true, entry: updated });
}

async function requireAdmin(request, env) {
  if (["POST", "PATCH", "PUT", "DELETE"].includes(request.method.toUpperCase())) {
    const originCheck = requireSameOrigin(request);
    if (originCheck) return originCheck;
  }
  const sessionId = cookieValue(request, COOKIE_NAME);
  if (!sessionId) return json({ error: "No autorizado." }, 401);

  const session = await env.DB.prepare(
    "SELECT id, expires_at FROM admin_sessions WHERE id = ?"
  )
    .bind(sessionId)
    .first();

  if (!session) return json({ error: "No autorizado." }, 401);

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await env.DB.prepare("DELETE FROM admin_sessions WHERE id = ?").bind(sessionId).run();
    const headers = new Headers({ "content-type": "application/json; charset=utf-8" });
    headers.append("set-cookie", expiredCookie(request, COOKIE_NAME));
      headers.append("set-cookie", expiredCookie(request, CSRF_COOKIE));
    return new Response(JSON.stringify({ error: "Sesión vencida." }), { status: 401, headers });
  }

  return session;
}

function pickPublicEntry(row) {
  const out = {};
  for (const key of PUBLIC_ENTRY_FIELDS) out[key] = row[key] ?? null;
  return out;
}

async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) return null;
  const raw = await request.text();
  if (raw.length > MAX_JSON_BYTES) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function text(value, max = MAX_FIELD) {
  if (value == null) return "";
  return String(value).trim().slice(0, max);
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function json(data, status = 200) {
  return jsonResponse(data, status);
}

function jsonResponse(data, status = 200, request = null, extraCookies = []) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "cross-origin-opener-policy": "same-origin",
    "cache-control": "no-store",
  });
  if (request) {
    for (const [key, value] of Object.entries(securityHeaders(request, { noStore: true }))) {
      headers.set(key, value);
    }
  }
  for (const cookie of extraCookies) headers.append("set-cookie", cookie);
  return new Response(JSON.stringify(data), { status, headers });
}

function csrfCookies(request) {
  let token = cookieValue(request, CSRF_COOKIE);
  const cookies = [];
  if (!token) {
    token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();
    cookies.push(sessionCookie(CSRF_COOKIE, token, request, expiresAt, false));
  }
  return { token, cookies };
}

function cookieValue(request, name) {
  const header = request.headers.get("cookie") || "";
  const parts = header.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function sessionCookie(name, id, request, expiresAt, httpOnly = true) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const http = httpOnly ? "; HttpOnly" : "";
  return `${name}=${encodeURIComponent(id)}; Path=/; SameSite=Strict${http}; Expires=${new Date(expiresAt).toUTCString()}${secure}`;
}

function expiredCookie(request, name) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=; Path=/; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
}

function clientIp(request) {
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "local";
}

async function recordAttempt(env, ip, action) {
  await env.DB.prepare("INSERT INTO auth_attempts (ip, action) VALUES (?, ?)").bind(ip, action).run();
}

async function clearAttempts(env, ip, action) {
  await env.DB.prepare("DELETE FROM auth_attempts WHERE ip = ? AND action = ?").bind(ip, action).run();
}

async function enforceRateLimit(env, ip, action, windowMin, maxAttempts) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM auth_attempts
      WHERE ip = ? AND action = ? AND created_at >= datetime('now', ?)`
  )
    .bind(ip, action, `-${windowMin} minutes`)
    .first();
  if ((row?.n || 0) >= maxAttempts) {
    return json({ error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." }, 429);
  }
  if (action === "submit") await recordAttempt(env, ip, action);
  return null;
}

function requestOrigin(request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const referer = request.headers.get("referer");
  if (!referer) return "";
  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}

function requireSameOrigin(request) {
  const origin = requestOrigin(request);
  if (!origin) return json({ error: "Origen no permitido." }, 403);
  if (origin !== new URL(request.url).origin) return json({ error: "Origen no permitido." }, 403);
  return null;
}

function requireCsrf(request) {
  const header = request.headers.get("x-csrf-token") || "";
  const cookie = cookieValue(request, CSRF_COOKIE);
  if (!header || !cookie || !safeEqual(header, cookie)) {
    return json({ error: "Token de seguridad inválido." }, 403);
  }
  return null;
}

async function issueSession(request, env, extra = {}) {
  const sessionId = crypto.randomUUID();
  const csrf = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();
  await env.DB.prepare("INSERT INTO admin_sessions (id, expires_at) VALUES (?, ?)").bind(sessionId, expiresAt).run();
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    ...securityHeaders(request, { noStore: true }),
  });
  headers.append("set-cookie", sessionCookie(COOKIE_NAME, sessionId, request, expiresAt, true));
  headers.append("set-cookie", sessionCookie(CSRF_COOKIE, csrf, request, expiresAt, false));
  return new Response(JSON.stringify({ ok: true, csrf, ...extra }), { status: 200, headers });
}

function securityHeaders(request, opts = {}) {
  const headers = {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "cross-origin-opener-policy": "same-origin",
    "content-security-policy":
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  };
  if (opts.noStore) headers["cache-control"] = "no-store";
  if (request && new URL(request.url).protocol === "https:") {
    headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
  }
  return headers;
}

function withSecurityHeaders(request, response, opts = {}) {
  const next = new Response(response.body, response);
  const extra = securityHeaders(request, opts);
  for (const [key, value] of Object.entries(extra)) next.headers.set(key, value);
  return next;
}

function safeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  const max = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let i = 0; i < max; i += 1) {
    diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  }
  return diff === 0;
}
