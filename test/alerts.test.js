import { describe, expect, test } from "bun:test";
import worker from "../src/index.js";

function createMockEnv(initialAlert = null) {
  let alertRow = initialAlert || {
    id: 1,
    is_active: 0,
    message: "",
    link_url: "",
    link_text: "",
  };

  const env = {
    ADMIN_USER: "admin",
    DB: {
      prepare(sql) {
        let boundArgs = [];
        const stmt = {
          bind(...args) {
            boundArgs = args;
            return stmt;
          },
          async first() {
            if (sql.includes("SELECT is_active, message, link_url, link_text FROM site_alerts WHERE id = 1 AND is_active = 1")) {
              if (alertRow.is_active && alertRow.message?.trim()) {
                return {
                  is_active: alertRow.is_active,
                  message: alertRow.message,
                  link_url: alertRow.link_url,
                  link_text: alertRow.link_text,
                };
              }
              return null;
            }
            if (sql.includes("FROM site_alerts WHERE id = 1")) {
              return alertRow;
            }
            if (sql.includes("FROM admin_sessions")) {
              return { id: boundArgs[0], expires_at: new Date(Date.now() + 3600000).toISOString() };
            }
            return null;
          },
          async run() {
            if (sql.includes("INSERT INTO site_alerts") || sql.includes("UPDATE site_alerts")) {
              alertRow = {
                id: 1,
                is_active: boundArgs[0],
                message: boundArgs[1],
                link_url: boundArgs[2],
                link_text: boundArgs[3],
              };
              return { meta: { changes: 1 } };
            }
            return { meta: { changes: 1 } };
          },
        };
        return stmt;
      },
    },
  };

  return { env, getAlert: () => alertRow };
}

describe("Site breaking news / emergency alert banner", () => {
  test("public GET /api/alert returns null when alert is inactive", async () => {
    const { env } = createMockEnv({ id: 1, is_active: 0, message: "Prueba inactiva", link_url: "", link_text: "" });
    const req = new Request("https://afroup.test/api/alert");
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.alert).toBeNull();
  });

  test("public GET /api/alert returns alert details when active", async () => {
    const { env } = createMockEnv({
      id: 1,
      is_active: 1,
      message: "Se necesitan donaciones urgentes para Chocó",
      link_url: "https://afroup.com/#puntos",
      link_text: "Ver centros de acopio",
    });
    const req = new Request("https://afroup.test/api/alert");
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.alert).not.toBeNull();
    expect(data.alert.is_active).toBe(true);
    expect(data.alert.message).toBe("Se necesitan donaciones urgentes para Chocó");
    expect(data.alert.link_url).toBe("https://afroup.com/#puntos");
    expect(data.alert.link_text).toBe("Ver centros de acopio");
  });

  test("admin endpoints require authentication", async () => {
    const { env } = createMockEnv();
    const getReq = new Request("https://afroup.test/api/admin/alert");
    const getRes = await worker.fetch(getReq, env);
    expect(getRes.status).toBe(401);

    const postReq = new Request("https://afroup.test/api/admin/alert", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://afroup.test" },
      body: JSON.stringify({ is_active: true, message: "Alerta" }),
    });
    const postRes = await worker.fetch(postReq, env);
    expect(postRes.status).toBe(401);
  });

  test("admin can update and activate the alert banner", async () => {
    const { env, getAlert } = createMockEnv();
    const sessionId = "valid-session-123";
    const csrfToken = "csrf-token-abc";

    const req = new Request("https://afroup.test/api/admin/alert", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `afroup_admin=${sessionId}; afroup_csrf=${csrfToken}`,
        "x-csrf-token": csrfToken,
        origin: "https://afroup.test",
      },
      body: JSON.stringify({
        is_active: true,
        message: "Urgente: Alerta por lluvias en Buenaventura",
        link_url: "#ayudas",
        link_text: "Ver detalles",
      }),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.alert.is_active).toBe(true);
    expect(data.alert.message).toBe("Urgente: Alerta por lluvias en Buenaventura");

    expect(getAlert().is_active).toBe(1);
    expect(getAlert().message).toBe("Urgente: Alerta por lluvias en Buenaventura");
  });

  test("rejects activating alert with empty message", async () => {
    const { env } = createMockEnv();
    const sessionId = "valid-session-123";
    const csrfToken = "csrf-token-abc";

    const req = new Request("https://afroup.test/api/admin/alert", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: `afroup_admin=${sessionId}; afroup_csrf=${csrfToken}`,
        "x-csrf-token": csrfToken,
        origin: "https://afroup.test",
      },
      body: JSON.stringify({
        is_active: true,
        message: "",
      }),
    });

    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("El mensaje de la noticia o alerta es obligatorio");
  });
});
